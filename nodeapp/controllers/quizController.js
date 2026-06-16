// nodeapp/controllers/quizController.js

const nodemailer = require("nodemailer");

const { Quiz, Result } = require("../models/Quiz");
const User = require("../models/User");


// =================================================
// QUIZ CRUD
// =================================================


exports.addQuiz = async (req, res) => {

try {

const {
title,
subject,
imgUrl,
questions,
category,
difficulty,
timeLimit,
isProtected
} = req.body;


if(!title || !subject || !questions?.length){

return res.status(400).json({
message:"Required fields missing"
});

}


const quiz = await Quiz.create({

title,
subject,
imgUrl,
questions,
category,
difficulty,
timeLimit,
isProtected,

createdBy:req.user.id

});


res.status(201).json(quiz);


}catch(err){

res.status(500).json({
error:err.message
});

}

};




// GET ALL

exports.getQuizzes = async(req,res)=>{

try{

const quizzes =
await Quiz.find()
.populate(
"createdBy",
"username role"
);


res.json(quizzes);


}catch(err){

res.status(500).json({
error:err.message
});

}

};




// GET SINGLE

exports.getQuizById = async(req,res)=>{

try{


const quiz =
await Quiz.findById(req.params.id)
.populate(
"createdBy",
"username"
);


if(!quiz)

return res.status(404).json({
message:"Quiz not found"
});


res.json(quiz);


}catch(err){

res.status(500).json({
error:err.message
});

}


};




// UPDATE


exports.updateQuiz = async(req,res)=>{

try{


const quiz =
await Quiz.findByIdAndUpdate(

req.params.id,

req.body,

{
new:true,
runValidators:true
}

);



if(!quiz)

return res.status(404).json({
message:"Quiz not found"
});



res.json(quiz);



}catch(err){


res.status(500).json({
error:err.message
});


}

};




// DELETE QUIZ


exports.deleteQuiz = async(req,res)=>{

try{


await Quiz.findByIdAndDelete(
req.params.id
);



res.json({
message:"Quiz deleted"
});



}catch(err){

res.status(500).json({
error:err.message
});

}


};






// =================================================
// BREVO SMTP SERVICE
// =================================================


const sendProctoringEmail = async(

studentEmail,
teacherEmail,
quizTitle,
score,
totalMarks,
violations,
cameraRecording,
screenRecording

)=>{


const attachments=[];



// webcam attachment

if(cameraRecording?.includes(";base64,")){


const mime =
cameraRecording.substring(
5,
cameraRecording.indexOf(";")
);


attachments.push({

filename:"webcam.webm",

content:Buffer.from(

cameraRecording.split(";base64,")[1],

"base64"

),

contentType:mime

});


}




// screen attachment


if(screenRecording?.includes(";base64,")){


const mime =
screenRecording.substring(
5,
screenRecording.indexOf(";")
);



attachments.push({

filename:"screen.webm",

content:Buffer.from(

screenRecording.split(";base64,")[1],

"base64"

),

contentType:mime


});


}




const transporter = nodemailer.createTransport({

  host: process.env.SMTP_HOST,

  port: 587,

  secure: false,

  auth: {

    user: process.env.SMTP_USER,

    pass: process.env.SMTP_PASS

  },

  requireTLS: true,

  tls: {
    minVersion: "TLSv1.2"
  },

  connectionTimeout: 60000,

  greetingTimeout: 60000,

  socketTimeout: 60000

});



console.log(
"📨 Sending using Brevo SMTP..."
);


console.log("SMTP TEST:", {
host:process.env.SMTP_HOST,
port:process.env.SMTP_PORT,
secure:process.env.SMTP_SECURE
});

await transporter.verify();

console.log("✅ Brevo SMTP connected");
await transporter.sendMail({


from:
`"ATS Proctoring" <thiru2005v@gmail.com>`,


to:teacherEmail,


subject:
`ATS Proctor Report - ${quizTitle}`,


html:`

<h2>ATS Automated Proctor Report</h2>

<table border="1" cellpadding="10">

<tr>
<td>Student</td>
<td>${studentEmail}</td>
</tr>


<tr>
<td>Quiz</td>
<td>${quizTitle}</td>
</tr>


<tr>
<td>Score</td>
<td>${score}/${totalMarks}</td>
</tr>


<tr>
<td>Tab Switches</td>
<td>${violations}</td>
</tr>


</table>

<p>
Camera and screen recordings attached if available.
</p>

`,


attachments


});



console.log(
"✅ Mail sent:",
teacherEmail
);


};







// =================================================
// SUBMIT QUIZ
// =================================================


exports.submitQuiz = async(req,res)=>{


try{


const {

quizId,
answers,
tabSwitches,
cameraRecording,
screenRecording

}=req.body;



const userId=req.user.id;



const quiz =
await Quiz.findById(
quizId
);



if(!quiz)

return res.status(404).json({
message:"Quiz missing"
});





let score=0;



quiz.questions.forEach(q=>{


const userAnswer =
answers.find(

a=>a.questionId===q._id.toString()

);



if(

userAnswer &&

userAnswer.answer===q.correctAnswer

)

score++;


});





await Result.create({


user:userId,


quiz:quizId,


score,


totalMarks:
quiz.questions.length,


answers,


tabSwitches:
tabSwitches || 0,


proctoringViolated:

(tabSwitches || 0)>=3


});






// SEND ONLY PROTECTED QUIZ


console.log(
"🔒 Protected:",
quiz.isProtected
);



if(quiz.isProtected){



const student =
await User.findById(
userId
);



const teacher =
await User.findById(
quiz.createdBy
);




console.log(
"Student:",
student?.username
);


console.log(
"Teacher:",
teacher?.username
);





if(student && teacher){


sendProctoringEmail(

student.username,

teacher.username,

quiz.title,

score,

quiz.questions.length,

tabSwitches || 0,

cameraRecording,

screenRecording


)

.then(()=>{

console.log(
"✅ Brevo background mail completed"
);

})

.catch(err=>{

console.log(
"❌ Brevo mail failed:",
err.message
);

});


}


}




res.json({

message:"Quiz submitted successfully",

score,

totalMarks:
quiz.questions.length


});



}catch(err){


console.log(err);



res.status(500).json({
error:err.message
});


}



};







// =================================================
// REPORTS
// =================================================



exports.getReports = async(req,res)=>{


try{


const user =
await User.findOne({
username:req.params.studentName
});



if(!user)

return res.status(404).json({
message:"User not found"
});



const reports =
await Result.find({
user:user._id
})
.populate(
"quiz",
"title subject"
);




res.json(

reports.map(r=>({

id:r._id,

quizTitle:
r.quiz?.title || "Deleted",

subject:
r.quiz?.subject || "N/A",

score:r.score,

totalMarks:r.totalMarks,

date:r.date


}))


);



}catch(err){


res.status(500).json({
error:err.message
});


}


};





exports.getAllReports = async(req,res)=>{


try{


const reports =
await Result.find()
.populate(
"user",
"username"
)
.populate(
"quiz",
"title subject"
);



const data={};



reports.forEach(r=>{


if(!r.user)
return;



if(!data[r.user.username])

data[r.user.username]=[];




data[r.user.username].push({


id:r._id,

quizTitle:r.quiz?.title,

subject:r.quiz?.subject,

score:r.score,

totalMarks:r.totalMarks,

date:r.date


});


});



res.json(data);



}catch(err){


res.status(500).json({
error:err.message
});


}


};




// DELETE REPORT


exports.deleteReport = async(req,res)=>{


try{


await Result.findByIdAndDelete(
req.params.id
);



res.json({
message:"Report deleted"
});



}catch(err){


res.status(500).json({
error:err.message
});


}


};








// FILTER


exports.filterQuizzes = async(req,res)=>{


try{


const filter={};



if(req.query.category)

filter.category=req.query.category;



if(req.query.difficulty)

filter.difficulty=req.query.difficulty;




const quizzes =
await Quiz.find(filter);




res.json(quizzes);



}catch(err){


res.status(500).json({
error:err.message
});


}


};







// SEARCH


exports.searchQuizzes = async(req,res)=>{


try{


const keyword =
req.query.keyword || "";



const quizzes =
await Quiz.find({

$or:[


{
title:{
$regex:keyword,
$options:"i"
}
},


{
subject:{
$regex:keyword,
$options:"i"
}
}


]


});



res.json(quizzes);



}catch(err){


res.status(500).json({
error:err.message
});


}


};








// STATS


exports.getUserStats=async(req,res)=>{


try{


const results =
await Result.find({
user:req.params.userId
});




res.json({


totalQuizzes:
await Quiz.countDocuments(),



totalAttempts:
results.length,



averageScore:


results.length?


(

results.reduce(

(a,b)=>a+b.score,

0

)

/results.length

).toFixed(2)


:0


});



}catch(err){


res.status(500).json({
error:err.message
});


}


};