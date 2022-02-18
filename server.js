require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
var bodyParser = require('body-parser');
const app = express();

// Configure the mongoose database

mongoose.connect(
  process.env.MONGO_URI,
  { useNewUrlParser: true, useUnifiedTopology: true }
);

let urlSchema = mongoose.Schema({
  num: {type: Number, required: true},
  linkedUrl: {type: String, required: true} 
});

const urlModel = mongoose.model('url', urlSchema);

let urlCountSchema = mongoose.Schema({
  urlNum: {type: Number, required: true}
});

const urlCountModel = mongoose.model('urlCount', urlCountSchema);

urlCountModel.countDocuments((err,cnt)=>{
  if(err)return console.log(err);

  else if(cnt<=0){
  
    let urlCount = new urlCountModel({urlNum:0});

  urlCount.save((err)=>{
    if(err) return console.log(err);
    else{
    console.log(`new url count made !\n`);
    }
  })
}
})



// Basic Configuration
const port = process.env.PORT || 3000;

app.use(cors());

app.use(bodyParser.urlencoded({extended: false}));

app.use(function (req, res, next) {
  var str=req.method + ' ' + req.path + ' - ' + req.ip;
  console.log(str+'\n');
  next();
});

app.use('/public', express.static(`${process.cwd()}/public`));

app.get('/', function(req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

// Your first API endpoint
app.get('/api/hello', function(req, res) {
  res.json({ greeting: 'hello API' });
});

// Main code

app.post('/api/shorturl', (req,res,next)=>{
  let count;
  if(!/\b(https?|ftp|file):\/\/[\-A-Za-z0-9+&@#\/%?=~_|!:,.;]*[\-A-Za-z0-9+&@#\/%=~_|]/.test(req.body.url)){
    res.json({error: "Invalid url"});
    next();
  }
  else{
    urlCountModel.find({},(err,arr)=>{
      if(err) return console.log(err);
        count = arr[0].urlNum;

      let it = new urlModel({num: count+1, linkedUrl: req.body.url})
      it.save((err)=>{
      if(err) return console.log(err);
      arr[0].urlNum = arr[0].urlNum+1;
      arr[0].save((err)=>{
        if(err) return console.log(err);
      })
      console.log(`Saving object: num: ${count+1} url: ${req.body.url}\n`);
    });
      res.json({url: req.body.url, shorturl: count+1});
      next();
    })
    
  }


})

app.get('/api/shorturl/:shorturl?', (req,res,next)=>{
  if(!/d*/.test(req.params.shorturl)){
    res.json({error: "This shorturl is not valid"})
    next();
  }
  else{
    urlModel.findOne({num: Number.parseInt(req.params.shorturl)}, (err, obj)=>{
      if(err)res.json({error: 'Shorturl not found'});
      else{
        console.log(`Redirecting to ${obj.linkedUrl}\n`);
        res.redirect(obj.linkedUrl);
      }
    })
  }
})

app.listen(port, function() {
  console.log(`Listening on port ${port}\n`);
});
