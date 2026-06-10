function isAuthenticated(req, res, next) {
    // Check if the user is authenticated by verifying the session
    if (req.session && req.session.email) {
        return next();
    } else {
        res.redirect('/auth/login');
    }
}

function isNotAuthenticated(req, res, next) {
    // Check if the user is not authenticated by verifying the session
    if (req.session && req.session.email) {
        res.redirect('/');
    } else {
        return next();
    }
}

module.exports = {
    isAuthenticated,
    isNotAuthenticated
}