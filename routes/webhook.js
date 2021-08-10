const express = require('express');
const router = express.Router();
const { spawn } = require('child_process');

/* POST home page. */
router.post('/', function(req, res, next) {
    if ( process.env.WEBHOOK_TOKEN == req.headers['x-gitlab-token'] ) {
        const projectID = req.body['project']['id']
        const pathParts = req.body['project']['path_with_namespace'].split('/');
        const projectSlug = pathParts[1];
        const scriptPath = 'sh ' + process.env.HOME +'/' + projectSlug + '/deploy.sh'
        const subprocess = spawn(
            scriptPath,
            [
                projectID,
                process.env.GITLAB_PRIVATE_TOKEN,
                projectSlug
            ],
            {
                detached: true,
                stdio: 'ignore',
                shell: true
        });
        subprocess.unref();
        console.log("Call scripts done!");
        res.json({ message: "Success" });
    } else {
        var forbiddenError = new Error( 'invalid or missing x-gitlab-token header');
        forbiddenError.status = 403;
        throw forbiddenError;
    }
});

module.exports = router;