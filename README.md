# send-it

## installation

sudo chmod -R 777 logs
NODE_ENV=dev pm2 start app.js --name atoms-api-dev


## notification formats

### schema
 ```JavaScript
{
    topic: "",
    text: "this task is due today",
    type: data, notification,

    meta: {
        actions: [{
            label: String, //'view'
            type: {type: String}, //'button' input methods
            operation: String, // 'httpGET,POST' 'intent',
            data: { // to inject part
                body: Object, 
                url: String,
                headers: Object
            },
            await: Boolean //to wait for response
            type: "input", // open, select, input
            controls: [{
                key: "newDate",
                text: "Postpone To",
                type: "date", // text, date, number
            }]
        }]
    }

     

 }
 

 ```

### opening an activity to Apply Leave

 ```JavaScript
{
    topic: "Late Today",
    text: "Want to apply leave",
    type: 'notification',
    isHidden: false
    meta: {
        actions: [{
            label: 'Apply', //'view'
            type: 'button', //'button' input methods
            operation: 'intent', // 'httpGET,POST' 'intent',
            data: { 
                activity: 'AddNewLeaveStep1'
                intent: {
                    date: '2018-03-21T18:30.000Z', // utc format
                }
            },
            await: false // no need to wait for response
            
        }, {
            label: 'View', 
            type: 'button', //'button' input methods
            operation: 'intent', // 'httpGET,POST' 'intent',
            data: { 
                activity: 'DayLogsView'
                intent: {
                    date: '2018-03-21T18:30.000Z', // utc format
                }
            },
            await: false // no need to wait for response
            
        },{
            label: 'Cancel', //'view'
            type: 'button', //'button' input methods
            operation: 'dismiss',
            await: false // no need to wait for response
        },]
    }
 }
 

 ```
### Approving a Leave

 ```JavaScript
{
    topic: "Leave Request",
    text: "Sachin has applied for 2 days Earned Leave(s) starting from 21st March",
    type: 'notification',
    isHidden: false
    meta: {
        actions: [{
            label: 'Approve', //'view'
            type: 'button', //'button' input methods
            operation: 'PUT', // 'httpGET,POST' 'intent',
            data: { 
                url: 'http://localhost:3008/leaves/599827c43b9ac00d9c35c15d'
                body: {
                    status: 'approved', 
                },
                header: {
                    'x-role-key': '{{X-ROLE-KEY}}' // {{X-ROLE-KEY}} - place holder or add by default
                }
            },
            await: true // do not dismiss till server responds with success
            
        }, {
            label: 'Reject', 
            type: 'button', //'button' input methods
            operation: 'PUT', // 'httpGET,POST' 'intent',
            data: { 
                url: 'http://localhost:3008/api/leaves/599827c43b9ac00d9c35c15d'
                body: {
                    status: 'rejected', 
                    message: '{{input:message}}'
                },
                header: {
                    'x-role-key': '{{X-ROLE-KEY}}' // {{X-ROLE-KEY}} - place holder or add by default
                }
            },
            await: true // do not dismiss till server responds with success
            
        }, {
            label: 'Message',      
            type: 'input', // get the user message here =
            operation: 'none', // 'httpGET,POST' 'intent',
            data: { 
                id: 'message',
                type: 'EditText', // Radio Button, Date Picker
            },
        }]
    }
 }
 ```

### Showing a Banner

 ```JavaScript
{
    topic: "Good Morning",
    text: "Words are, of course, the most powerful drug used by mankind",
    type: 'notification',
    isHidden: false
    meta: {
        actions: [{
            label: 'Show',
            type: 'button', 
            operation: 'banner', // opens the web view with the given url
            data: { 
                url: 'https://www.brainyquote.com/quotes/rudyard_kipling_101386'
            },
            await: true // do not dismiss till web view is rendered
            
        }, {
            label: 'Cancel', 
            type: 'button', 
            operation: 'dismiss',     
        }]
    }
 }
 ```
## Jobs
### a typical job

```JSON
{
    "code": "attendanceEmail",
    "processor": "email", // email, sms, push
    "schedule": {
        "hour": 16,
        "minute": 45
    },
    "template": {
        "code": "attendanceEmail"
    },
    "organization": {
        "code": "my-organization"
    },
    "data": {
        "source": {
            "url": "http://datasource.com/api/v2/employees",
            "field": "items",
            "type": "array",
            "headers": {
                "orgCode": "openage",
                "x-session-id": "usertoken"
            }
        }
    },
    "config": {
        "to": {
            "field": "User.Email",
            "code": "User.Id"
        },
        "from": "info@my-organization.in",
          "notify": [
                "admin@my-organization.in"
               ]
    },
  
}
```
