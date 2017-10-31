const toQueryString = (obj) => {
    return Object.keys(obj).map(k => `${encodeURIComponent(k)}=${encodeURIComponent(obj[k])}`).join('&');
}
module.exports = toQueryString