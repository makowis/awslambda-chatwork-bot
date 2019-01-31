import request = require("request");

interface ReplyWebhockEvent {
  from_account_id: number;
  to_account_id: number;
  room_id: number;
  message_id: number;
  body: string;
  send_time: number;
  update_time: number;
};

exports.handler = function(event: any, context: any, callback: Function) {        
    console.log('Received event:', JSON.stringify(event, null, 2));
    // Retrieve request parameters from the Lambda function input:
    const signature = event.headers['X-ChatWorkWebhookSignature'];
    const body = event.body;
 
    if (validate(signature, body)) {
        // Webhookで行いたい処理
        const webhook_event = JSON.parse(body).webhook_event;
        sendMessage(webhook_event);
        callback(null, {"statusCode": 200, "body": "Success"});
    }  else {
        callback(null, {"statusCode": 403, "body": "Forbidden"});
    }
};
 
const validate = function(signature: any, body: string){
    var cipheredBody = digest(body);
    return cipheredBody === signature;
};
 
const digest = function(value: string){
    const secret = decode(process.env.TOKEN as string);
    const crypto = require('crypto');
    const hash = crypto.createHmac('SHA256', secret).update(value).digest('base64');
    return hash;
};
 
const encode = function(value: string){
    const buffer = new Buffer(value);
    const encoded = buffer.toString('base64');
    return encoded;
};
 
const decode = function(value: string){
    const buffer = new Buffer(value, 'base64');
    return buffer;
};

const sendMessage = function(webhook_event:ReplyWebhockEvent) {
  let message: string = 'ご安全に';
  if (webhook_event.body.indexOf('ぬるぽ') > -1) {
    message = 'ガッ';
  } else if (webhook_event.body.indexOf('骨') > -1) {
    message = 'これ見て元気出せよ\nhttp://www.shuzo.co.jp/'  
  }
  reply(webhook_event, message);
};

const reply = function(webhook_event:ReplyWebhockEvent, message: string) {
  
  const url = `https://api.chatwork.com/v2/rooms/${webhook_event.room_id}/messages`;
  const body = `[rp aid=${webhook_event.from_account_id} to=${webhook_event.room_id}-${webhook_event.message_id}]\n${message}`;
  const options = {
    url: url,
    headers: {
      'X-ChatWorkToken': process.env.APITOKEN
    },
    form : {body : body},
    useQuerystring: true
  };

  request.post(options, function (err: any, res: any, body: any) {
    if (!err && res.statusCode == 200) {
      console.log('投稿成功');
    }else{
      console.log(`投稿失敗\nstatus_code:${res.statusCode}\nerror:${err}`);
    }
  });
};