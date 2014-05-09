/**
 * Created by leman on 9/5/2014.
 */
/**
 * Created by leman on 9/5/2014.
 */

var port = 3718;

var express = require('express');
var app = express();
var io = require('socket.io').listen(app.listen(port));
var Room = require('./room');

var numConn = 0;

app.use(express.static(__dirname + '/sample/public'));


io.sockets.on('connection', function (socket) {
    numConn ++;
    socket.on('disconnect', function(){
        numConn --;
        console.log('Disconnected. No of connection:'+numConn);
    });
    console.log('Connected. No of connection:'+numConn);

    socket.emit('connected');
    socket.on('room-connect', function(data){
        Room.tryConnectOwner ( data.room , socket);
    });
    socket.on('room-create', function (data) {
        Room.create(socket);
    });
});