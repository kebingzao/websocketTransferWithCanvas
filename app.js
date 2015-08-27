var WebSocket = require('faye-websocket'),
        fs = require('fs'),
        tlv = require('tlv'),
        http      = require('http');


var server = http.createServer();
// 是否停止传输
var isStop = false;
// 每次传输的延迟时间, 默认500毫秒
var delayTime = 500;
// 等待客户端连接上来
server.on('upgrade', function(request, socket, body) {
    if (WebSocket.isWebSocket(request)) {
        var ws = new WebSocket(request, socket, body);

        ws.on('open', function(event) {
            console.log("已经有客户端连接上来");
            ws.send(JSON.stringify({
                action: 1,
                data:'I am the server and I\'m listening!'
            }));
        });

        ws.on('message', function(event) {
            if(typeof event.data === "string") {
                var data = JSON.parse(event.data);
                var msg = '';
                switch (data.action) {
                    case 1:
                        // 文本信息，原样返回
                        msg = "server return ==>: " + data.data;
                        ws.send(JSON.stringify({
                            action: data.action,
                            data: msg
                        }));
                        break;
                    case 2:
                        console.log("开始传输图片");
                        isStop = false;
                        // 发送图片
                        postImg();
                        break;
                    case 3:
                        console.log("停止传输图片");
                        // 停止传输
                        isStop = true;
                        break;
                    case 4:
                        // 参数设置
                        delayTime = parseInt(data.data);
                        console.log("设置传输间隔为：" + delayTime);
                        if(isStop){
                            isStop = false;
                            postImg();
                        }
                        break;
                }
            }else{
                console.log("二进制传过来");
                // 然后转化为字符串
                console.log(new Buffer(event.data).toString());
            }
        });

        ws.on('close', function(event) {
            console.log('close', event.code, event.reason);
            console.log("websocket 断开连接");
            ws = null;
        });

        // 发送图片
        var postImg = function(){
            setTimeout(function(){
                if(isStop){
                    return;
                }
                // 二进制流的方式
                // 随机获取 0-4张的某一张图片
                var url = __dirname + "/images/" + Math.round(Math.random()* 4) + ".jpg";
                // 接下来转化为 二进制数据
                var imgByteBuf = new Buffer(fs.readFileSync(url));
                // 接下来再转化为字节数
                var len = imgByteBuf.length;
                // 接下来是几个随机值
                var x = Math.round(Math.random()* 800);
                var y = Math.round(Math.random()* 600);
                var w = Math.round(Math.random()* 800);
                var h = Math.round(Math.random()* 600);
                // 这边定义格式为 [x=%d,y=%d,w=%d,h=%d,len=%d,scale=%d,rotation=%d,flag=%d]
                var str = "[x="+ x +",y="+ y +",w="+ w +",h="+ h +",len="+ len +",scale=0,rotation=0,flag=0]";
                var paramStrBufferArray = [];
                // 固定128位字节用来做参数控制
                for(var i=0;i<128;i++){
                    paramStrBufferArray.push(0);
                }
                var paramStrBuffer = new Buffer(paramStrBufferArray);
                //console.log(JSON.stringify(paramStrBuffer));
                // 接下来写入数据
                paramStrBuffer.write(str,0,new Buffer(str).length);
                //console.log(JSON.stringify(paramStrBuffer));
                // 接下来把这两个拼起来,并输出到前端
                ws.send(Buffer.concat([paramStrBuffer,imgByteBuf]));
                //ws.send(paramStrBuffer);
                postImg();
            },delayTime);
        };
    }
});

server.listen(3006,function(){
    console.log("websocket server start");
});