const { createLogger, transports, format} = require('winston');
require('winston-mongodb');

const timezoned = () => {
    return new Date().toLocaleString('en-US', {
        timeZone: 'Asia/Bangkok'
    });
}

const logger = createLogger({
    transports: [
        new transports.Console({
            level: 'info',
            format: format.combine(format.timestamp({ format: timezoned }), format.json())
        }),
        new transports.MongoDB({
            level: 'error',
            db: `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.0ka3b.mongodb.net/${process.env.DB_NAME}?retryWrites=true&w=majority`,
            options: {
                useUnifiedTopology: true
            },
            collection: 'Logger',
            format: format.combine(format.timestamp({ format: timezoned }), format.json())
        })
    ]
})

module.exports = logger;