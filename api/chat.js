export default function handler(req, res) {
    res.status(200).json({
        message: 'JavaScript backend reachable',
        method: req.method,
        url: req.url
    });
}
