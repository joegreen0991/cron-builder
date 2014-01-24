var Cron = function(){
     
    var Cron = function(parent){
                 
            var choosers = {
                'min'   :  Cron.Chooser({range:{end: 59}},{'multiple':'multiple'}),
                'hour'  :  Cron.Chooser({range:{end: 23}},{'multiple':'multiple'}),
                'dow'   :  Cron.Chooser({values:Cron.lang.days.split('|')},{'multiple':'multiple'}),
                'dom'   :  Cron.Chooser({range:{start:1, end:31}},{'multiple':'multiple'}),
                'month' :  Cron.Chooser({values:Cron.lang.months.split('|')},{'multiple':'multiple'})
            },
                    
            time = [Util.dom.text(' ' + Cron.lang.at + ' '), choosers.hour, Util.dom.text(':'), choosers.min],
            
            runEvery = {
                values : Cron.lang.options,
                options: [
                    [],
                    [Util.dom.text(' ' + Cron.lang.at + ' '), choosers.min, Util.dom.text(' ' + Cron.lang.timestring)],
                    time,
                    [Util.dom.text(' '+Cron.lang.on+' '), choosers.dow].concat(time),
                    [Util.dom.text(' '+Cron.lang.on+' '+Cron.lang.the+' '), choosers.dom].concat(time),
                    [Util.dom.text(' '+Cron.lang.on+' '+Cron.lang.the+' '), choosers.dom, Util.dom.text(' '+Cron.lang.of+' '), choosers.month].concat(time)
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
                    
            cronType = Cron.Chooser({values:runEvery.values}),
            
            getSelectOptions = function(el){
                var selected = [];
                for (var i = 0; i < el.options.length; i++) {
                    if (el.options[i].selected) selected.push(el.options[i].value);
                }
                return selected;
            },
            
            build = function()
            {
                parent.innerHTML = '';

                Util.dom.append(parent, [Util.dom.text(Cron.lang.every + ' '), cronType]);

                Util.dom.append(parent, runEvery.options[cronType.value]);
            };
        
        Cron.Event.change(cronType, function(){
            build();
            evaluate();
        });
        
        for(var i in choosers){
            Cron.Event.change(choosers[i], function(){
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
    

    Cron.Event = function(){

            var Cache = {
                    cache : {},
                    store : function( elem, type, handler ){
                            if(!Cache.cache[type]){
                                    Cache.cache[type] = [];
                            }
                            Cache.cache[type].push([elem, type, handler]);
                    },
                    get : function( elem, type ){
                            if(!Cache.cache[type]){
                                    return false;
                            }
                            for(var i = 0; i < Cache.cache[type].length; i++){
                                if(Cache.cache[type][i][0] === elem) return Cache.cache[type][i][2];
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
                    trigger : function(elem, type)
                    {
                        var handler = Cache.get(elem, type);
                        handler && handler.call(elem, window.event);
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

    }();
    
    Cron.lang = {
        'days' : 'Sunday|Monday|Tuesday|Wednesday|Thursday|Friday|Saturday',
        'months' : 'Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec',
        'options' : ['Minute', 'Hour', 'Day', 'Week', 'Month', 'Year'],
        'timestring' : 'minutes past the hour',
        'at' : 'at',
        'every' : 'Every',
        'on' : 'on',
        'of' : 'of',
        'the' : 'the'
    };
    
    Cron.Chooser = function(config, options) {
        
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
    };

    
    return Cron;
}();
