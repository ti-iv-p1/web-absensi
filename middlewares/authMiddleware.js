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

// autorize('admin');
// authorize('admin', 'dosen');
// authorize('admin', 'dosen', 'mahasiswa');
function authorize(...peran){
    return (req, res, next) => {
        // Check if the user has the required role(s) to access the route
        // If the user's role is not in the allowed roles, return a 403 Forbidden responses
        if(!req.session || !req.session.peran || !peran.includes(req.session.peran)){
            // return res.status(403).send('Access Denied');
            return res.render('pages/error', 
                { pesanError: 'Access Denied : Anda Tidak Memiliki Hak Akses' });
        }
        next();
    }
}

module.exports = {
    isAuthenticated,
    isNotAuthenticated,
    authorize
}