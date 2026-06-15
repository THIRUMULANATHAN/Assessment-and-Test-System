import React, { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axiosInstance from "../../api/axiosInstance";
import {
  FaLock,
  FaVideo,
  FaDesktop,
  FaUserShield,
  FaClock,
  FaExclamationTriangle,
  FaCheckCircle,
  FaArrowLeft
} from "react-icons/fa";
import "../../styles/TakeQuiz.css";

const TakeQuiz = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  // Quiz states
  const [quiz, setQuiz] = useState(null);
  const [answers, setAnswers] = useState([]);
  const [current, setCurrent] = useState(0);
  const [visited, setVisited] = useState([]);
  const [submitted, setSubmitted] = useState(false);
  const [checkResult, setCheckResult] = useState(null);

  // Proctoring Setup States
  const [isProctoringReady, setIsProctoringReady] = useState(false);
  const [cameraPerm, setCameraPerm] = useState("pending"); // "pending", "ready", "error"
  const [screenPerm, setScreenPerm] = useState("pending");
  const [isBypassedProctoring, setIsBypassedProctoring] = useState(false);

  // Stream States
  const [cameraStream, setCameraStream] = useState(null);
  const [screenStream, setScreenStream] = useState(null);

  // Blocker States
  const [showFullscreenWarning, setShowFullscreenWarning] = useState(false);
  const [showTabWarning, setShowTabWarning] = useState(false);
  const [tabSwitches, setTabSwitches] = useState(0);

  // Timer States
  const [timeLeft, setTimeLeft] = useState(null);
  const [timerActive, setTimerActive] = useState(false);

  // Media Recording Refs
  const camRecorderRef = useRef(null);
  const screenRecorderRef = useRef(null);
  const camBlobsRef = useRef([]);
  const screenBlobsRef = useRef([]);
  const videoRef = useRef(null);
  const isSwitchingRef = useRef(false);
  const cameraStreamRef = useRef(null);
  const screenStreamRef = useRef(null);

  // 1. Initial Load of Quiz
  useEffect(() => {
    const loadQuiz = async () => {
      try {
        const res = await axiosInstance.get(`/quizzes/${id}`);
        setQuiz(res.data);
        setAnswers(res.data.questions.map(q => ({ questionId: q._id, answer: "" })));
        setVisited(Array(res.data.questions.length).fill(false));
        setTimeLeft(res.data.timeLimit * 60); // minutes to seconds
        
        // If the quiz is not proctored/protected, route to the test screen immediately
        if (!res.data.isProtected) {
          setIsProctoringReady(true);
        }
      } catch (err) {
        alert(err.response?.data?.message || "Failed to load quiz");
        navigate("/student/quizzes", { replace: true });
      }
    };
    loadQuiz();
  }, [id, navigate]);

  // 2. Video Preview Stream Binding
  useEffect(() => {
    if (videoRef.current && cameraStream) {
      videoRef.current.srcObject = cameraStream;
    }
  }, [cameraStream, isProctoringReady]);

  // 3. Full Screen change Listener
  useEffect(() => {
    if (!isProctoringReady || submitted || isBypassedProctoring || !quiz?.isProtected) return;

    const handleFullscreenChange = () => {
      if (!document.fullscreenElement) {
        setShowFullscreenWarning(true);
        setTimerActive(false);
      } else {
        setShowFullscreenWarning(false);
        setTimerActive(true);
      }
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, [isProctoringReady, submitted, isBypassedProctoring, quiz]);

  // 4. Tab Switch Visibility & Window Focus Listeners
  useEffect(() => {
    if (!isProctoringReady || submitted || isBypassedProctoring || !quiz?.isProtected) return;

    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        triggerTabSwitch();
      }
    };

    const handleWindowBlur = () => {
      triggerTabSwitch();
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("blur", handleWindowBlur);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("blur", handleWindowBlur);
    };
  }, [isProctoringReady, submitted, isBypassedProctoring, quiz]);

  // 5. Timer Countdown Tick
  useEffect(() => {
    if (!timerActive || timeLeft === null || submitted) return;

    if (timeLeft <= 0) {
      setTimerActive(false);
      alert("Time is up! Your quiz is being submitted automatically.");
      forceSubmit(tabSwitches);
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft(prev => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [timerActive, timeLeft, submitted, tabSwitches]);

  // Clean up streams on unmount
  useEffect(() => {
    return () => {
      if (cameraStreamRef.current) {
        cameraStreamRef.current.getTracks().forEach(t => t.stop());
      }
      if (screenStreamRef.current) {
        screenStreamRef.current.getTracks().forEach(t => t.stop());
      }
    };
  }, []);

  // ------------------ PROCTOR METHODS ------------------

  const triggerTabSwitch = () => {
    if (isSwitchingRef.current || submitted) return;
    isSwitchingRef.current = true;

    setTabSwitches(prev => {
      const next = prev + 1;
      if (next >= 3) {
        alert("Assessment automatically submitted due to exceeding the maximum of 3 tab switch violations.");
        forceSubmit(next);
      } else {
        setShowTabWarning(true);
        setTimerActive(false);
      }
      return next;
    });

    setTimeout(() => {
      isSwitchingRef.current = false;
    }, 1500);
  };

  const requestPermissionsAndStart = async () => {
    if (!navigator.mediaDevices) {
      alert(
        "Proctoring Error: Security block. Media devices are disabled because this site is loaded over insecure HTTP.\n\n" +
        "Please access the app using 'localhost' (e.g., http://localhost:5174) or use HTTPS."
      );
      setCameraPerm("error");
      setScreenPerm("error");
      return;
    }

    let camSt = null;
    let scrSt = null;

    try {
      // Camera Request (try audio + video, fallback to video only)
      setCameraPerm("pending");
      try {
        camSt = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      } catch (audioErr) {
        console.warn("Audio/Webcam combined permission failed, trying video only...", audioErr);
        camSt = await navigator.mediaDevices.getUserMedia({ video: { width: 640, height: 480 } });
      }
      setCameraStream(camSt);
      cameraStreamRef.current = camSt;
      setCameraPerm("ready");

      // Screen Request
      setScreenPerm("pending");
      scrSt = await navigator.mediaDevices.getDisplayMedia({ video: true });
      setScreenStream(scrSt);
      screenStreamRef.current = scrSt;
      setScreenPerm("ready");

      // Enter Fullscreen (graceful fallback if blocked)
      try {
        const docEl = document.documentElement;
        if (docEl.requestFullscreen) {
          await docEl.requestFullscreen();
        } else if (docEl.webkitRequestFullscreen) {
          await docEl.webkitRequestFullscreen();
        } else if (docEl.mozRequestFullScreen) {
          await docEl.mozRequestFullScreen();
        } else if (docEl.msRequestFullscreen) {
          await docEl.msRequestFullscreen();
        }
      } catch (fsErr) {
        console.warn("Fullscreen request rejected:", fsErr);
      }

      // Start Camera Recording (try webm, fallback to default, gracefully ignore crashes)
      try {
        let camRec;
        try {
          camRec = new MediaRecorder(camSt, { mimeType: "video/webm" });
        } catch (recErr) {
          console.warn("WebM camera recording unsupported, using default MediaRecorder:", recErr);
          try {
            camRec = new MediaRecorder(camSt);
          } catch (defaultRecErr) {
            console.error("Default MediaRecorder for camera failed:", defaultRecErr);
          }
        }
        if (camRec) {
          camBlobsRef.current = [];
          camRec.ondataavailable = e => { if (e.data && e.data.size > 0) camBlobsRef.current.push(e.data); };
          camRec.start(1000);
          camRecorderRef.current = camRec;
        }
      } catch (camRecErr) {
        console.error("Camera recording could not be initialized:", camRecErr);
      }

      // Start Screen Recording (try webm, fallback to default, gracefully ignore crashes)
      try {
        let scrRec;
        try {
          scrRec = new MediaRecorder(scrSt, { mimeType: "video/webm" });
        } catch (recErr) {
          console.warn("WebM screen recording unsupported, using default MediaRecorder:", recErr);
          try {
            scrRec = new MediaRecorder(scrSt);
          } catch (defaultRecErr) {
            console.error("Default MediaRecorder for screen failed:", defaultRecErr);
          }
        }
        if (scrRec) {
          screenBlobsRef.current = [];
          scrRec.ondataavailable = e => { if (e.data && e.data.size > 0) screenBlobsRef.current.push(e.data); };
          scrRec.start(1000);
          screenRecorderRef.current = scrRec;
        }
      } catch (scrRecErr) {
        console.error("Screen recording could not be initialized:", scrRecErr);
      }

      // Toggle Flags
      setIsProctoringReady(true);
      setTimerActive(true);
    } catch (err) {
      console.error("Proctoring permission error:", err);
      // Clean up if partially granted
      if (camSt) camSt.getTracks().forEach(t => t.stop());
      if (scrSt) scrSt.getTracks().forEach(t => t.stop());
      
      setCameraPerm(camSt ? "ready" : "error");
      setScreenPerm(scrSt ? "ready" : "error");
      
      const isDev = window.location.hostname === "localhost" || 
                    window.location.hostname === "127.0.0.1" || 
                    window.location.hostname.startsWith("192.168.") || 
                    window.location.hostname.startsWith("10.") || 
                    window.location.hostname.startsWith("172.");
      const errorMsg = err.message || err;
      
      if (isDev) {
        const confirmBypass = window.confirm(
          `Proctoring Error: ${errorMsg}\n\n` +
          `It seems like permissions were not fully granted or your environment is restricting media capture (e.g., if you are in an iframe or have no camera connected).\n\n` +
          `[DEV MODE]: Would you like to bypass proctoring requirements and start the test anyway?`
        );
        if (confirmBypass) {
          setIsBypassedProctoring(true);
          setIsProctoringReady(true);
          setTimerActive(true);
        }
      } else {
        alert(
          `Proctoring Error: ${errorMsg}\n\n` +
          "Camera & Screen Sharing permissions are required to start this protected test. Please ensure you grant them."
        );
      }
    }
  };

  const restoreFullscreen = async () => {
    try {
      const docEl = document.documentElement;
      if (docEl.requestFullscreen) {
        await docEl.requestFullscreen();
      } else if (docEl.webkitRequestFullscreen) {
        await docEl.webkitRequestFullscreen();
      } else if (docEl.mozRequestFullScreen) {
        await docEl.mozRequestFullScreen();
      } else if (docEl.msRequestFullscreen) {
        await docEl.msRequestFullscreen();
      }
      setShowFullscreenWarning(false);
      setTimerActive(true);
    } catch (err) {
      alert("Fullscreen restoration failed. Please try again.");
    }
  };

  const closeTabWarning = async () => {
    setShowTabWarning(false);
    setTimerActive(true);
    if (!isBypassedProctoring && !document.fullscreenElement) {
      await restoreFullscreen();
    }
  };

  // Compile media recording buffers into base64 format
  const compileVideo = (recorder, blobsRef) => {
    return new Promise((resolve) => {
      if (!recorder) {
        resolve(null);
        return;
      }

      // If already inactive but we have accumulated blobs, compile them immediately
      if (recorder.state === "inactive") {
        if (!blobsRef.current || blobsRef.current.length === 0) {
          resolve(null);
          return;
        }
        const type = recorder.mimeType || "video/webm";
        const blob = new Blob(blobsRef.current, { type });
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.readAsDataURL(blob);
        return;
      }

      // Register the onstop handler first, then call stop()
      recorder.onstop = () => {
        if (!blobsRef.current || blobsRef.current.length === 0) {
          resolve(null);
          return;
        }
        const type = recorder.mimeType || "video/webm";
        const blob = new Blob(blobsRef.current, { type });
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.readAsDataURL(blob);
      };

      try {
        recorder.stop();
      } catch (err) {
        console.warn("MediaRecorder stop failed:", err);
        // Fallback: resolve immediately with existing blobs if stop throws
        if (blobsRef.current && blobsRef.current.length > 0) {
          const type = recorder.mimeType || "video/webm";
          const blob = new Blob(blobsRef.current, { type });
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result);
          reader.readAsDataURL(blob);
        } else {
          resolve(null);
        }
      }
    });
  };

  // ------------------ SUBMIT LOGIC ------------------

  const handleSubmit = async () => {
    if (!window.confirm("Are you sure you want to submit the test?")) return;
    await doSubmit(tabSwitches);
  };

  const forceSubmit = async (currentViolations) => {
    await doSubmit(currentViolations);
  };

  const doSubmit = async (currentViolations) => {
    setSubmitted(true);
    setTimerActive(false);

    // Exit fullscreen
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
    }

    // Compile recordings first, while streams are still active (to prevent early recorder inactivation)
    let camBase64 = null;
    let screenBase64 = null;

    try {
      camBase64 = await compileVideo(camRecorderRef.current, camBlobsRef);
    } catch (err) {
      console.error("Failed compiling proctor camera recording:", err);
    }

    try {
      screenBase64 = await compileVideo(screenRecorderRef.current, screenBlobsRef);
    } catch (err) {
      console.error("Failed compiling proctor screen recording:", err);
    }

    // Stop streams now that recording compilation is complete/handled
    if (cameraStream) {
      cameraStream.getTracks().forEach(t => t.stop());
      cameraStreamRef.current = null;
    }
    if (screenStream) {
      screenStream.getTracks().forEach(t => t.stop());
      screenStreamRef.current = null;
    }

    try {
      await axiosInstance.post(`/quizzes/${id}/submit`, {
        quizId: id,
        answers,
        tabSwitches: currentViolations,
        cameraRecording: camBase64,
        screenRecording: screenBase64
      });
      alert("Quiz submitted successfully! Proctoring records and alerts have been sent to your instructor's Gmail.");
      navigate("/student/quizzes", { replace: true });
    } catch (err) {
      alert(err.response?.data?.message || "Submission failed");
    }
  };

  // ------------------ QUIZ HELPER METHODS ------------------

  const handleChange = (questionId, value) => {
    setAnswers(prev =>
      prev.map(a => (a.questionId === questionId ? { ...a, answer: value } : a))
    );
    setCheckResult(null);
  };

  const handleClear = (questionId) => {
    setAnswers(prev =>
      prev.map(a => (a.questionId === questionId ? { ...a, answer: "" } : a))
    );
    setCheckResult(null);
  };

  const handleNext = () => {
    setVisited(prev => {
      const updated = [...prev];
      updated[current] = true;
      return updated;
    });

    if (current < quiz.questions.length - 1) {
      setCurrent(prev => prev + 1);
    }
  };

  const handlePrev = () => {
    if (current > 0) setCurrent(prev => prev - 1);
  };

  const handleQuestionClick = (index) => {
    setVisited(prev => {
      const updated = [...prev];
      updated[index] = true;
      return updated;
    });
    setCurrent(index);
    setCheckResult(null);
  };

  const handleCheckAnswer = () => {
    const currentQ = quiz.questions[current];
    const selected = answers.find(a => a.questionId === currentQ._id)?.answer;
    if (!selected) {
      setCheckResult("Please select an option.");
      return;
    }
    if (selected === currentQ.correctAnswer) {
      setCheckResult("✅ Correct Answer!");
    } else {
      setCheckResult(`❌ Incorrect. Correct answer: ${currentQ.correctAnswer}`);
    }
  };

  const formatTime = (seconds) => {
    if (seconds === null) return "00:00";
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };

  if (!quiz) return <div className="container center" style={{ height: "100vh" }}>Loading...</div>;

  // ------------------ RENDERING PREP STATE ------------------
  if (!isProctoringReady) {
    return (
      <div className="container center" style={{ height: "100vh", background: "#f8fafc" }}>
        <article className="proctor-terms-card">
          <h2><FaUserShield style={{ color: "#ef4444", verticalAlign: "middle", marginRight: "8px" }} /> Protected Assessment</h2>
          <p>This exam is actively proctored. You must grant the required system accesses to start the test. Your webcam feed and screen capture will be recorded and attached to the report sent to your instructor.</p>

          <div className="proctor-checklist">
            <div className="proctor-checklist-item">
              <span>Webcam & Microphone Feed</span>
              <span className={`proctor-status ${cameraPerm}`}>
                {cameraPerm === "ready" ? "Granted" : cameraPerm === "pending" ? "Pending" : "Required"}
              </span>
            </div>
            <div className="proctor-checklist-item">
              <span>Full Screen Sharing Capture</span>
              <span className={`proctor-status ${screenPerm}`}>
                {screenPerm === "ready" ? "Granted" : screenPerm === "pending" ? "Pending" : "Required"}
              </span>
            </div>
            <div className="proctor-checklist-item">
              <span>Enforced Fullscreen Lock</span>
              <span className="proctor-status ready">Enforced</span>
            </div>
            <div className="proctor-checklist-item">
              <span>Window Switch Warnings (Max 3)</span>
              <span className="proctor-status ready">Active</span>
            </div>
          </div>

          <button
            type="button"
            className="btn"
            style={{ width: "100%" }}
            onClick={requestPermissionsAndStart}
          >
            Agree & Start Assessment
          </button>

          {(window.location.hostname === "localhost" || 
            window.location.hostname === "127.0.0.1" || 
            window.location.hostname.startsWith("192.168.") || 
            window.location.hostname.startsWith("10.") || 
            window.location.hostname.startsWith("172.")) && (
            <button
              type="button"
              className="btn secondary"
              style={{ 
                width: "100%", 
                marginTop: "12px", 
                background: "transparent", 
                border: "1px dashed #6366f1", 
                color: "#6366f1" 
              }}
              onClick={() => {
                setIsBypassedProctoring(true);
                setIsProctoringReady(true);
                setTimerActive(true);
              }}
            >
              Bypass Proctoring (Dev Mode)
            </button>
          )}
        </article>
      </div>
    );
  }

  // ------------------ RENDERING QUIZ ACTIVE STATE ------------------
  const q = quiz.questions[current];
  const answeredCount = answers.filter(a => a.answer !== "").length;
  const notViewedCount = visited.filter(v => !v).length;
  const skippedCount = visited.filter((v, i) => v && !answers[i].answer).length;

  return (
    <div className="quiz-main">
      {/* ⚠️ FULLSCREEN BLOCKER OVERLAY */}
      {showFullscreenWarning && (
        <div className="proctor-blocker-overlay">
          <div className="proctor-blocker-modal">
            <h3><FaExclamationTriangle /> Fullscreen Mode Exited</h3>
            <p>Protected assessments require full screen mode. Leaving fullscreen has been flagged. Please restore fullscreen immediately to resume the test.</p>
            <button type="button" className="btn danger" onClick={restoreFullscreen} style={{ width: "100%" }}>
              Restore Fullscreen & Resume
            </button>
          </div>
        </div>
      )}

      {/* ⚠️ TAB SWITCH WARNING OVERLAY */}
      {showTabWarning && (
        <div className="proctor-blocker-overlay">
          <div className="proctor-blocker-modal">
            <h3><FaExclamationTriangle /> Proctor Warning!</h3>
            <p>You have navigated away from the assessment screen! This tab switch event is forbidden and has been reported to the instructor.</p>
            <div className="badge danger" style={{ padding: "8px 16px", fontSize: "0.95rem", marginBottom: "20px" }}>
              Violations: {tabSwitches} / 3 Warnings
            </div>
            <button type="button" className="btn" onClick={closeTabWarning} style={{ width: "100%" }}>
              I Understand & Resume Test
            </button>
          </div>
        </div>
      )}

      {/* MAIN QUESTION SECTION */}
      <div className="question-section">
        <div className="question-header">
          <h4>Question {current + 1} of {quiz.questions.length}</h4>
          <p>Score: 1 Mark | Negative Marks: 0</p>
        </div>

        <div className="question-body">
          <h3 className="q-title">Multiple Choice Question</h3>
          <p className="q-text">{q.questionText}</p>

          <div className="options">
            {["op1", "op2", "op3", "op4"].map((opKey) => (
              <label key={opKey} className="option-label">
                <input
                  type="radio"
                  name={q._id}
                  value={q.options[opKey]}
                  checked={answers.find(a => a.questionId === q._id)?.answer === q.options[opKey]}
                  onChange={(e) => handleChange(q._id, e.target.value)}
                />
                {q.options[opKey]}
              </label>
            ))}
          </div>

          {checkResult && (
            <div className={`check-result ${checkResult.includes("Correct") ? "correct" : "incorrect"}`}>
              {checkResult}
            </div>
          )}

          <div className="option-actions">
            <button type="button" className="btn ghost" onClick={() => handleClear(q._id)}>Clear Answer</button>
            {!quiz.isProtected && (
              <button type="button" className="btn secondary" onClick={handleCheckAnswer}>Check Correct Answer</button>
            )}
          </div>

          <div className="nav-buttons">
            <button type="button" className="btn secondary" onClick={handlePrev} disabled={current === 0}>
              <FaArrowLeft /> Previous
            </button>
            {current === quiz.questions.length - 1 ? (
              <button type="button" className="btn submit" onClick={handleSubmit} disabled={submitted}>
                Submit Assessment
              </button>
            ) : (
              <button type="button" className="btn" onClick={handleNext}>Next & Save</button>
            )}
          </div>
        </div>
      </div>

      {/* RIGHT PANEL (MONITOR & TIMERS) */}
      <div className="right-panel">
        
        {/* Webcam Proctor preview */}
        {quiz.isProtected && (
          <div className="proctor-cam-widget" style={isBypassedProctoring ? { border: "2px solid #6366f1", boxShadow: "0 4px 12px rgba(99, 102, 241, 0.15)" } : {}}>
            {isBypassedProctoring ? (
              <div className="proctor-rec-badge" style={{ background: "rgba(99, 102, 241, 0.85)" }}>
                <span style={{ height: "8px", width: "8px", borderRadius: "50%", background: "#ffffff", display: "inline-block" }}></span> DEV BYPASS
              </div>
            ) : (
              <div className="proctor-rec-badge">
                <span style={{ height: "8px", width: "8px", borderRadius: "50%", background: "#ffffff", display: "inline-block" }}></span> REC LIVE
              </div>
            )}
            {isBypassedProctoring ? (
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", color: "#94a3b8", fontSize: "0.85rem", flexDirection: "column", padding: "10px", textAlign: "center" }}>
                <FaUserShield style={{ fontSize: "1.5rem", color: "#6366f1", marginBottom: "8px" }} />
                Proctoring Bypassed
              </div>
            ) : (
              <video
                ref={videoRef}
                autoPlay
                muted
                playsInline
                className="proctor-cam-video"
              />
            )}
          </div>
        )}

        {/* Timer countdown */}
        <h4>Time Remaining</h4>
        <div className="timer-container">
          <FaClock style={{ color: timeLeft < 60 ? "#ef4444" : "#64748b" }} />
          <span className={`timer-value ${timeLeft < 60 ? "warning" : ""}`}>
            {formatTime(timeLeft)}
          </span>
        </div>

        {/* Questions navigation grid */}
        <h4>Questions Grid</h4>
        <div className="question-grid">
          {quiz.questions.map((_, index) => {
            const ans = answers[index]?.answer;
            const wasVisited = visited[index];
            let btnClass = "qnum";
            if (ans) btnClass += " answered";
            else if (wasVisited && !ans) btnClass += " skipped";
            else btnClass += " unvisited";
            if (current === index) btnClass += " active";

            return (
              <button
                key={index}
                className={btnClass}
                onClick={() => handleQuestionClick(index)}
              >
                {index + 1}
              </button>
            );
          })}
        </div>

        <div className="status-summary">
          <p><span className="dot green"></span> Answered: {answeredCount}</p>
          <p><span className="dot red"></span> Skipped: {skippedCount}</p>
          <p><span className="dot gray"></span> Not Viewed: {notViewedCount}</p>
        </div>
      </div>
    </div>
  );
};

export default TakeQuiz;
