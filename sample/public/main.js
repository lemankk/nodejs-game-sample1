
var isDesktop = false;
var isConnected =  false;
var socket = io.connect('http://192.168.0.130:3718');
var roomNo = null;
var roomExist = false;
var roomStarted = false;

var accelerator = {x: 0, y:0, z:0 };

var ActionTypes = {
    NONE:0,
    LEFT: 1<<1,
    RIGHT: 1<<2,
    TOP: 1<<3,
    DOWN: 1<<4
};
var lastAction = ActionTypes.NONE;

var getActionByAccelerator = function(){
    var val = ActionTypes.NONE;

    if( accelerator.y < -5) {
        if (accelerator.z <= -3) {
            val += ActionTypes.TOP;
        }
        if (accelerator.z >= 3) {
            val += ActionTypes.DOWN;
        }
        if (accelerator.x <= -3) {
            val += ActionTypes.LEFT;
        }
        if (accelerator.x >= 3) {
            val += ActionTypes.RIGHT;
        }
    }
    return val;
};

var updateTextByActionType = function(){

    var str = '';
    if( lastAction != ActionTypes.NONE) {
        if ( (lastAction & ActionTypes.TOP) != 0) {
            str+='move up\n';
        }
        if ((lastAction & ActionTypes.DOWN)   != 0) {
            str+='move down\n';
        }
        if ((lastAction & ActionTypes.LEFT)   != 0) {
            str+='move left\n';
        }
        if ((lastAction & ActionTypes.RIGHT)   != 0) {
            str+='move right\n';
        }
    }else {
        str += 'no move\n';
    }

    str +="\n\nlastAction="+ lastAction;
    $pre.text(str);
}

var updateTextByAccelerator = function(){

    var str = '';
    if( accelerator.y < -5) {
        if (accelerator.z <= -3) {
            str+='move up\n';
        }
        if (accelerator.z >= 3) {
            str+='move down\n';
        }
        if (accelerator.x <= -3) {
            str+='move left\n';
        }
        if (accelerator.x >= 3) {
            str+='move right\n';
        }
    }else{
        str+='no move\n';
    }
    str+='\n\n'+  'x: ' + (accelerator.x * 100 << 0) / 100 + ',\ny: ' + (accelerator.y * 100 << 0) / 100 + ',\nz: ' + (accelerator.z * 100 << 0) / 100 + '';
    $pre.text(str);
}

var render = function(){

    if (! Modernizr.touch ) {
        if (roomExist) {
            if (!roomStarted) {
                $('.room-no').text(roomNo);
                $pre.text('Please connect your room with mobile');
            } else {
                updateTextByActionType();
            }
        }
    }else{
        if( roomStarted) {

            updateTextByAccelerator();

            var newAction = getActionByAccelerator();
            if( lastAction != newAction){
                socket.emit('action', {room: roomNo ,action: newAction});
                lastAction = newAction;
            }

            //socket.emit('pos', {accelerator: accelerator});
        }else{
            $pre.text('Please enter room no.');
        }
    }
    requestAnimationFrame(render);
}

    socket.on('disconnected', function(){
        roomExist = false;
        roomStart = false;
        roomNo = null;
        $pre.text('Disconnected...');
        $('.room-no').text('-');
    });
    socket.on('connected', function (data) {
        //    console.log(data);
        //    socket.emit('my other event', { my: 'data' });

        $startBtn.prop('disabled',false);
        $createBtn.prop('disabled',false);

        $pre.text('Ready');

        socket.on('action', function(data){
            if( data.room == roomNo) {
                if( lastAction != data.action ){
                    lastAction = data.action;

                    if ((lastAction & ActionTypes.LEFT)   != 0) {
                        document.getElementById('main').setMoveFlag( -1 );
                    }else if ((lastAction & ActionTypes.RIGHT)   != 0) {
                        document.getElementById('main').setMoveFlag(1);
                    }else{
                        document.getElementById('main').setMoveFlag(0);
                    }
                }
            }
        });
        socket.on('pos', function(data){
            accelerator.x = data.accelerator.x;
            accelerator.y = data.accelerator.y;
            accelerator.z = data.accelerator.z;
        });
        socket.on('room-create', function(data){
            console.log('room-create',arguments);
            if( data.room) {
                roomExist = true;
                roomNo = data.room;
            }else{
                roomExist = false;
                $pre.text('Full.');
            }
        });

        socket.on('room-connect', function(data){

            if( !data.error ) {
                roomStarted = true;
                $startBtn.text('Disconnect');


                if (Modernizr.touch) {
                    roomNo = data.room;
                    roomExist = true;
                }else{
                    document.getElementById('main').gameStart();
                }


            }else{
                $pre.text('Cannot connect: ' + data.error.type );
            }
        });
        socket.on('room-disconnect', function(data) {

            roomStarted = false;
            $startBtn.text('Connect');
            console.log('room-disconnect',arguments);
            if ( Modernizr.touch ) {
                roomNo = null;
                roomExist = false;
            }else{

                document.getElementById('main').gameStop();
            }

        });

        socket.on('room-end', function(){
        console.log('room-end',arguments);
        if ( Modernizr.touch ) {
            roomNo = null;
            roomExist = false;
        }
        roomStarted = false;
        $startBtn.text('Connect');
    });
});
var $input, $pre, $startBtn, $createBtn;
$(function(){
    $pre = $('pre');
    $input = $('.input-room-no');
    $startBtn = $('.btn-connect');
    $createBtn = $('.btn-create-room') ;

    if (! Modernizr.touch ) {
        $pre.text('Please create room first.');
        $createBtn.on('click', function () {
            socket.emit('room-create');
        });


        var swfVersionStr = "11.8.0";

        var xiSwfUrlStr = "";
        var flashvars = {};
        var params = {};
        flashvars.gameOnly = "yes";
        flashvars.ssid = "tmp";
        params.quality = "high";
        params.bgcolor = "#cccccc";
        params.play = "true";
        params.loop = "true";
        params.wmode = "window";
        params.scale = "showall";
        params.menu = "false";
        params.devicefont = "false";
        params.salign = "";
        params.allowscriptaccess = "sameDomain";
        var attributes = {};
        attributes.id = "main";
        attributes.name = "main";
        attributes.align = "middle";
        swfobject.createCSS("html", "height:100%; background-color: #cccccc;");
        swfobject.createCSS("body", "margin:0; padding:0; overflow:hidden; height:100%;");
        swfobject.embedSWF(
        "main.swf", "flashContent",
            "800", "600",
        swfVersionStr, xiSwfUrlStr,
        flashvars, params, attributes);
    }else{

        window.ondevicemotion = function(event) {
            accelerator.x = event.accelerationIncludingGravity.x;
            accelerator.y = event.accelerationIncludingGravity.y;
            accelerator.z = event.accelerationIncludingGravity.z;
        }
        $startBtn.on('click',function(){
            if( roomStarted){
                socket.emit('room-disconnect', {room: roomNo});
                console.log('Disconnect');
                return;
            }
            socket.emit('room-connect', {room: $input.val()});
        });
    }
    render();
});