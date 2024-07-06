const express = require("express");
const app = express();
app.set('trust proxy', false);
const fs = require('fs');
const childProcess = require('child_process');
const multer = require('multer');


const path = require('path');
// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.use(express.json());
app.use(express.urlencoded({
    extended: true
}));
const port = process.env.PORT || 4000;

app.get("/", async (req, res, next) => {
    res.render('download');
});
const allowedFileTypes = ['video/mp4','audio/wav'];
const fileFilter = (req, file, cb) => {
        if (allowedFileTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
        cb(null, false);
        }
  
 
};
const  storage  =  multer.diskStorage({ 
    destination: function (req, file, cb) {
        cb(null, 'tmp/')
      },
      filename: function (req, file, cb) {
        filetype = file.mimetype;
        
        if(file.mimetype=='video/mp4'){
            cb(null, "tmp.mp4")

        }else{
            cb(null,"tmp.wav")
        }
      }
  })
const upload = multer({ fileFilter:fileFilter,
    storage:storage,
    limits: { fileSize: 50 * 1024 * 1024 } // 50MB
});


app.post("/download",upload.single('file'),(req,res,next)=>{
        var starttime= req.body['starttime'];
        var duration = req.body['endtime']-starttime;
        if(duration<=0){
            res.send("切り抜き開始秒数が、切り抜き終了秒数よりも小さくなっています");
        }
        try{
            if(req.file.mimetype!=='video/mp4' && req.file.mimetype!=='audio/wav'){
                res.send('mp4か、wavファイルを選択してください')  
            }
        } catch(err){
            console.log(req.file.mimetype)
            res.send('mp4か、wavファイルを選択してください')
        }

        if (req.file.mimetype==='audio/wav'){
            async function videoTrimming(starttime,duration){
                //ffmpegを使い、音声ファイルを切り抜き
                await childProcess.execSync(`ffmpeg -nostdin -ss ${starttime} -i tmp/tmp.wav -t ${duration} -c copy tmp/output.wav`);
                res.download("tmp/output.wav",(err)=>{
                    //使い終わった音声ファイルを削除
                    deleteFile('tmp/tmp.wav');
                    deleteFile('tmp/output.wav');
                 console.log("end");

                });
            }
            videoTrimming(starttime,duration);
        }else{
            async function videoTrimming(starttime,duration){
                //ffmpegを使い、音声ファイルを切り抜き
                await childProcess.execSync(`ffmpeg -nostdin -ss ${starttime} -i tmp/tmp.mp4 -t ${duration} -c copy tmp/output.mp4`);
                res.download("tmp/output.mp4",(err)=>{
                    //使い終わった音声ファイルを削除
                    deleteFile('tmp/tmp.mp4');
                    deleteFile('tmp/output.mp4');
                    console.log("end");
                });
            }
            videoTrimming(starttime,duration);
        }
});

function deleteFile(filePath){
    try {
      fs.unlinkSync(filePath);
      return true;
    } catch(err) {
      return false;
    }
  }
  app.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
  })
