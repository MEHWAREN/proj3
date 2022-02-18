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

let urlSchema = mongoose.schema({
  num: {type: Number, required: true},
  linkedUrl: {type: String, required: true} 
});

const urlModel = mongoose.model('url', urlSchema);

let urlCountSchema = mongoose.schema({
  urlnum: {type: Number, required: true}
});

const urlCountModel = mongoose.model('urlCount', urlCountSchema);

console.log(`url count in database: ${urlCountModel.countDocuments({})}\n`);

if(urlCountModel.countDocuments({})==0 || !urlCountModel.countDocuments({})){
  let urlCount = new urlCountModel({urlNum:0});
  urlCount.save((err,data)=>{
    if(err) return console.log(err);
    else{
    console.log(`new url count made !\n`);
    }
  })
}



// Basic Configuration
const port = process.env.PORT || 3000;

app.use(cors());

app.use(bodyParser.urlencoded({extended: false}));

app.use(function (req, res, next) {
  var str=req.method + ' ' + req.path + ' - ' + req.ip;
  console.log(str);
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
  if(!/https?:\/\/www.?\w+.\w+/.test(req.body.url)){
    res.json({error: "Invalid url"});
    next();
  }
  else{
    urlCountModel.find({},(err,arr)=>{
      if(err) return console.log(err);
      else{
        count = arr[0].urlNum;
      }
    })

    let it = new urlModel({num: count+1, linkedUrl: req.body.url})
    it.save((err)=>{
      if(err) return console.log(err);
    });
    res.json({url: req.body.url, shorturl: count+1});
    next();
  }


})

app.get('/api/shorturl/:shorturl?', (req,res,next)=>{
  if(!/d+/.test(req.params.shorturl)){
    res.json({error: "This shorturl is not valid"})
    next();
  }
  else{
    urlModel.findOne({num: Number.parseInt(req.params.shorturl)}, (err, obj)=>{
      if(err)res.json({error: 'Shorturl not found'});
      else{
        res.redirect(obj.linkedUrl);
      }
    })
  }
})

app.listen(port, function() {
  console.log(`Listening on port ${port}`);
});
