# CatLog

## API

### CatLog.setConfig(key,value);

设置全局值, 每个请求都会带上

```
    window.CatLog.setUserId("userId");
```

### CatLog.trace(EventScreen,EventAction,EventLabel,EventValue)
发送默认的打点的请求，主要参数包括EventScreen，EventAction，EventLabel,EventValue

```
    window.CatLog.trace("EventScreen1","EventAction1","EventLabel1","EventValue1")

```


### CatLog.log(options)

发送打点请求，用于发送自定义数据

```

    window.CatLog.log({
        EventScreen:"", //URL或App屏幕名称 , 可不传, 默认当前URL
        EventAction:"", //例如“浏览”, “点击”, “焦点”(on-focus)等
        EventLabel:"",  //按钮和控件的名称(只适于“点击”或“焦点”事件)
        EventValue:"",
        Key1:"key1",
        Key2:"key2",
        Key3:"key3"
    });
    
    //任何其他字段都可以加在里面
    
```