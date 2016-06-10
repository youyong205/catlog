# CatLog

## API

### CatLog.setConfig(key,value);

设置全局值, 每个请求都会带上

```javascript
    CatLog.setConfig("userId","123");
```


### CatLog.log(options)

发送打点请求

```javascript

    CatLog.log({
        EventScreen:"", //URL或App屏幕名称 , 可不传, 默认当前URL
        EventAction:"", //例如“浏览”, “点击”, “焦点”(on-focus)等
        EventLabel:"",  //按钮和控件的名称(只适于“点击”或“焦点”事件)
        EventValue:""
    });
    
    //任何其他字段都可以加在里面
    
```