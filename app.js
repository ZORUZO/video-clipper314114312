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
    //mp4かwav形式以外のファイルはアップロードしないようにする
        if (allowedFileTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
        cb(null, false);
        }
  
 
};
const  storage  =  multer.diskStorage({ 
    //ファイルの保管場所の設定
    destination: function (req, file, cb) {
        cb(null, './')
      },
      filename: function (req, file, cb) {
        if(file.mimetype==='video/mp4'){
            cb(null, "tmp.mp4")
        }else{
            cb(null,"tmp.wav")
        }
      }
  })
const upload = multer({ fileFilter:fileFilter,
    storage:storage,
    limits: { fileSize: 50 * 1024 * 1024 } //アップロードされる50MBまでに制限
});


app.post("/download",upload.single('file'),(req,res,next)=>{
    if (!req.file) {
        return res.status(400).send({ message: 'ファイルの種類が無効であるか、ファイルが大きすぎます。' });
    }
        var starttime= req.body['starttime'];
        var duration = req.body['endtime']-starttime;
        if(duration<=0){
            deleteFile('tmp.wav');
            deleteFile('tmp.mp4');
            return res.status(400).send({ message: '切り抜き開始秒数が、切り抜き終了秒数よりも小さくなっています' });
        } else{
            if (req.file.mimetype==='audio/wav'){
                async function videoTrimming(starttime,duration){
                    //ffmpegを使い、音声ファイルを切り抜き
                    await childProcess.execSync(`ffmpeg -nostdin -ss ${starttime} -i tmp.wav -t ${duration} -c copy output.wav`);
                    res.download("output.wav",(err)=>{
                        //使い終わった音声ファイルを削除
                        deleteFile('tmp.wav');
                        deleteFile('output.wav');
                    });
                }
                videoTrimming(starttime,duration);
            }else{
                async function videoTrimming(starttime,duration){
                    //ffmpegを使い、動画ファイルを切り抜き
                    await childProcess.execSync(`ffmpeg -nostdin -ss ${starttime} -i tmp.mp4 -t ${duration} -c copy output.mp4`);
                    res.download("output.mp4",(err)=>{
                        //使い終わった動画ファイルを削除
                        deleteFile('tmp.mp4');
                        deleteFile('output.mp4');
                    });
                }
                videoTrimming(starttime,duration);
            }
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
