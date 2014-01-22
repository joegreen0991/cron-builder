var Cron = function(){
     
    /**
    * Cross browser event handling
     */

    var Event = function(window,document){

            var Cache = {
                    cache : {},
                    store : function( elem, type, handler ){
                            if(!Cache.cache[type]){
                                    Cache.cache[type] = [];
                            }
                            Cache.cache[type].push([elem, type]);
                    },
                    get : function( elem, type ){
                            if(!Cache.cache[type]){
                                    return false;
                            }
                            for(var i = 0; i < Cache.cache.length; i++){
                                    if(Cache.cache[type][i][0] === elem) return type;
                            }
                    }
            };

            var Exports = {
                    unbind : function() {  
                            if ( document.removeEventListener ) {  
                                    return function( elem, type, handler ) {  
                                            if ( (elem && elem.nodeName) || elem === window ) {  
                                                    var handler = handler || Cache.get(elem, type);
                                                    elem.removeEventListener(type, handler, false );  
                                            }  
                                            else if ( elem && elem.length ) {  
                                                    var len = elem.length;  
                                                    for ( var i = 0; i < len; i++ ) {  
                                                            Exports.unbind( elem[i], type );  
                                                    }  
                                            }  
                                    };  
                            }  
                            else if ( document.detachEvent ) {  
                                    return function ( elem, type, handler ) {  
                                            if ( (elem && elem.nodeName) || elem === window ) {  
                                                    var handler = handler || Cache.get(elem, type);
                                                    elem.detachEvent( 'on' + type, handler );  
                                            }  
                                            else if (elem && elem.length ) {  
                                                    var len = elem.length;  
                                                    for ( var i = 0; i < len; i++ ) {  
                                                            Exports.unbind( elem[i], type );  
                                                    }  
                                            }  
                                    };  
                            }  
                    }(),

                    bind : function() {  
                            if ( document.addEventListener ) {  
                                    return function( elem, type, handler ) { 
                                            if ( (elem && elem.nodeName) || elem === window ) { 
                                                    Cache.store( elem, type, handler );
                                                    elem.addEventListener(type, handler, false );  
                                            }  
                                            else if ( elem && elem.length ) {  
                                                    var len = elem.length;  
                                                    for ( var i = 0; i < len; i++ ) {  
                                                            Exports.bind( elem[i], type, handler );  
                                                    }  
                                            }  
                                    };  
                            }  
                            else if ( document.attachEvent ) {  
                                    return function ( elem, type, handler ) {  
                                            if ( (elem && elem.nodeName) || elem === window ) {  
                                                    Cache.store( elem, type, handler );
                                                    elem.attachEvent( 'on' + type, function() { return handler.call(elem, window.event) } );  
                                            }  
                                            else if (elem && elem.length ) {  
                                                    var len = elem.length;  
                                                    for ( var i = 0; i < len; i++ ) {  
                                                            Exports.bind( elem[i], type, handler );  
                                                    }  
                                            }  
                                    };  
                            }  
                    }(),
                    hover : function(el, inCallback,outCallback){

                            var inFunc = function(event){

                                    Exports.one(el,'mouseout',outFunc);
                                    inCallback && inCallback(event);
                            };

                            var outFunc = function(event){

                                    Exports.one(el,'mouseover',inFunc);
                                    outCallback && outCallback(event);
                            };

                            Exports.one(el,'mouseover',inFunc);

                    },
                    one : function(el,type,callback){

                            var inFunc = function(event){
                                    Exports.unbind(el,type,inFunc);
                                    callback && callback(event);
                            };

                            Exports.bind(el,type,inFunc);

                    }
            };

            var bindings = ['blur','change','click','dblclick','focus','keydown','keypress','keyup','load','mousedown','mouseenter','mouseleave','mouseover','mouseout','mouseup','resize','scroll','submit'];

            for(var i = 0; i < bindings.length; i++){
                    (function(i){
                            Exports[bindings[i]] = function(element,handler){
                                    return Exports.bind(element, bindings[i],handler);
                            };
                    })(i);
            }

            return Exports;

    }(window,document),
    
    Chooser = function(config, options) {
        
            var select = Util.dom.createElement('select','',options || {});

            if(config.range)
            {
                config.range.end && config.range.end > 1 || Util.error('Invalid range. "config.range.end" must be greater than 1.');

                for(var i = config.range.start || 0; i <= config.range.end; i++)
                {
                    var j = (i < 10) ? '0' + i : i;
                    select.appendChild(Util.dom.createElement('option',j,{value:i}));
                }
            }else{
                for(var i in config.values)
                {
                    select.appendChild(Util.dom.createElement('option', config.values[i], {value:i}));
                }
            }

            return select;
        },
    
    Cron = function(parent){
                    
            var choosers = {
                'min'   :  Chooser({range:{end: 59}},{'multiple':'multiple'}),
                'hour'  :  Chooser({range:{end: 23}},{'multiple':'multiple'}),
                'dow'   :  Chooser({values:'Sunday|Monday|Tuesday|Wednesday|Thursday|Friday|Saturday'.split('|')},{'multiple':'multiple'}),
                'dom'   :  Chooser({range:{start:1, end:31}},{'multiple':'multiple'}),
                'month' :  Chooser({values:'Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec'.split('|')},{'multiple':'multiple'})
            },
                    
            time = [Util.dom.text(' at '), choosers.hour, Util.dom.text(':'), choosers.min],
            
            runEvery = {
                values : ['Minute', 'Hour', 'Day', 'Week', 'Month', 'Year'],
                options: [
                    [],
                    [Util.dom.text(' at '), choosers.min, Util.dom.text(' minutes past the hour')],
                    time,
                    [Util.dom.text(' on '), choosers.dow].concat(time),
                    [Util.dom.text(' on the '), choosers.dom].concat(time),
                    [Util.dom.text(' on the '), choosers.dom, Util.dom.text(' of '), choosers.month].concat(time)
                ],
                build : [
                    ['*', '*', '*' , '*', '*'],
                    ['min', '*', '*' , '*', '*'],
                    ['min', 'hour', '*' , '*', '*'],
                    ['min', 'hour', 'dow' , '*', '*'],
                    ['min', 'hour', 'dow' , 'dom', '*'],
                    ['min', 'hour', 'dow' , 'dom', 'month']
                ]
            },
                    
            cronType = Chooser({values:runEvery.values}),
            
            getSelectOptions = function(el){
                var selected = [];
                for (var i = 0; i < el.length; i++) {
                    if (el.options[i].selected) selected.push(el.options[i].value);
                }
                return selected;
            },
            
            build = function()
            {
                parent.innerHTML = '';

                Util.dom.append(parent, [Util.dom.text('Every'), cronType]);

                Util.dom.append(parent, runEvery.options[cronType.value]);
            };
        
        
        Event.change(cronType, function(){
            build();
            evaluate();
        });
        
        for(var i in choosers){
            Event.change(choosers[i], function(){
                evaluate();
            });
        }
        
        
        build();
        
        var evaluate = this.evaluate = function()
        {
            var cron = [];
            
            for(var i in runEvery.build[cronType.value])
            {
                var k = runEvery.build[cronType.value][i];
                cron.push(choosers[k] ? (getSelectOptions(choosers[k]).join(',') || '*') : '*');
            }
            return cron.join(' ');
        };
    },
    Util = {
        'dom' : {
            'text' : function(text){return document.createTextNode(text);},
            'createElement' : function(el,content,params){var el = document.createElement(el); el.innerHTML = content || '';for(var i in params || {}) el.setAttribute(i,params[i]);return el;},
            'append' : function(el, append){for(var i = 0; i < append.length; i++) el.appendChild(append[i]);return el;}
        },
        'loop' : function(o,c){for (var i = 0; i < o.length; i++) {c.call(o[i],i);}},
        'extend' : function(){var e=function(t,n){for(var r in n){if(n.hasOwnProperty(r)){var i=n[r];if(t.hasOwnProperty(r)&&typeof t[r]==="object"&&typeof i==="object"){e(t[r],i)}else{t[r]=i}}}return t};var t={};for(var n=0;n<arguments.length;n++){t=e(t,arguments[n])}return t},
        'error' : function(message){throw new Error(message);}
    };

    
    return Cron;
}();
