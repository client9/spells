class Expr2 extends Array {
    constructor(name, ...args) {
        super(...args)
        this.name = name
    }
    toString() {
        if (this.length== 0) {
            return "";
        }
        return this.name+ "[" + this.map(x => (x.toString())).join(" ")  + "]"

    }
}
export function Equal(...args) {
    if (args.length < 2) {
        return true
    }
    let first = args[0]
    return args.every(function(x) { return x === first })
}

export function Expr(name, ...args) {
    let ary = Array.from(args)
    ary.name = name
    ary.toString = function(){
        return this.name+ "[" +
            this.map(x => (x.toString())).join(" ") 
            + "]"
    }
    return ary
}
export function ToString(arg) {
    if (typeof arg === "string") {
        return arg
    }
    // works for most types.. object TBD
    return JSON.stringify(arg)
}

export function Dimensions(a, n=999, out=[]) {
    if (n <= 0 || (! Array.isArray(a))) {
        return out
    }
    out.push(a.length)
    // all entries are arrays with same length
    if ( Equal(Map((x) => (Array.isArray(x) ? x.length : -1), a))) {
        return Dimensions(a[0], n-1, out)
    }
    return out
}

export function Head(x) {
    if (typeof x === 'undefined') {
        return 'undefined';
    }
    return x.name || x.constructor.name
}
export function Tail(x) {
    return x
}
export function First(x) {
    return x.at(0)
}
export function Rest(x) {
    return x.slice(1)
}
export function Take(x, n) {
    return x.slice(0, n)
}
export function Last(x) {
    return x.at(-1)
}
export function Partition(arr, n) {
    if (n <= 0) {
        return null
    }
    let out = [];
    for (let i=0,len=arr.length;i<len; i+=n) {
        out.push(arr.slice(i,i+n))
    }
    return out
}
export function Transpose(matrix) {
    let out = []
    let cols = matrix[0].length
    let rows = matrix.length
    for (let j = 0; j < cols; j++) {
        let row = []
        for (let i = 0; i < rows; i++) {
            row.push(matrix[i][j])
        }
        out.push(row)
    }
    return out
}
export function Map(fn,args) {
    return args.map(fn)
}
export function MapThread(fn, ...lists) {
    return Map((x) => (Apply(fn,x)), Transpose(lists)) 
}

function mapindexed_level1(fn, data) {
    const out = Array(data.length)
    for (let i=0; i < out.length; i++) {
        out[i] = fn(data[i], [i])
    }
    return out
}
export function MapIndexed(fn, data, level) {
    // fast case.. there is another when level is =[1]
    if (!level || level === 1 ) { return mapindexed_level1(fn, data) }

    const out = Array(data.length)
    for (let i=0; i < out.length; i++) {
        out[i] = fn(data[i], i)
    }
    return out
}

export function Apply(fn, list) {
    if (typeof fn ==  "string") {
        list.name = fn
        return list
    }
    return fn(...list)
}
export function Join(x, sep) {
    return x.join(sep)
}

export function StringPadLeft(str, n, pad=" ") {
    // easy optimization here
    // str.length  + x * padding.length = n
    // x* pad.len = n - str.len
    const x =  Math.ceil((n - str.length) / pad.length)
    if (x > 0) {
        str = Array(x).fill("").join(pad) + str
    }
    if (str.length > n) {
        return str.slice(0, n)
    }
    return str
}

export function Range(n) {
    return Array.from(Array(n).keys())
}

export function StringJoin(...args) {
    return args.flat(999).join("")
}

export function SameQ(...args) {
    if (args.length < 2) {
        return true;
    }
    let a = args[0]
    let b = args[1]

    // basic types
    if (a === b) {
        return true;
    }

    if (a === null || b === null) {
        return false;
    }

    if (typeof a !== 'object' || typeof b !== 'object') {
        return false;
    }

    // array version
    if (Array.isArray(a) && Array.isArray(b)) {
        if (a.length != b.length) {
            return false
        }
        for (let i=0; i < a.length; i++) {
            if (! SameQ(a[i],b[i])) {
                return false;
            }
        }
        return true
    }

    // objects
    const keysA = Object.keys(a);
    const keysB = Object.keys(b);
    if (keysA.length !== keysB.length) return false;
    for (let key of keysA) {
        if (!b.hasOwnProperty(key) || !SameQ(a[key], b[key])) return false;
    }

    return true;
}

export function Sow(self, arg) {
    if (arguments.length == 1) {
        //  probably something like: Sow[1]
        //  maybe pop exception instead
        return self
    }
    if (self && self._seeds) {
        self._seeds.push(arg)
    }
    return arg
}

export function Reap(fn) {
    const obj = {
        _seeds: [],
    }
    return [ fn.call(obj), obj._seeds ]
}

export function TestCreate(f, expected=true, message="") {
    return new Expr("TestObject", f, expected, message)
}

function testEvaluate(opt) {
    opt.outcome = "NotEvaluated"
    delete opt.failureType

    const startTime = performance.now()
    try {
        opt.actualOutput  = opt.testFunction(opt.input)
        if (SameQ(opt.expectedOutput, opt.actualOutput)) {
            opt.outcome = "Success"
            return opt
        }
        opt.outcome = "Failure"
        opt.failureType = "SameTestFailure"
    } catch (e) {
        // TBD intermediate test
        opt.outcome =  "Failure"
        opt.failureType = "UncaughtThrowFailure"   
        console.log("EXCEPTION: ", e)
        opt.actualOutput = e
    } finally {
        opt.timeElapsed =   performance.now() - startTime
    }
    return opt
}

export function TestEvaluate(list) {
    return Map((x) => testEvaluate(x), list)
}

function argsig(...args) {
    return Join(Map((x) => Head(x), args), " ")
}

function dispatch(registry, ...args) {
    let sig = argsig(...args);
    let f = registry.find( (x) => sig.match(x[1]));
    if (f) {
        return f[2](...args)
    }
    return null
}

function dispatch(registry, ...args) {
     console.log(registry)
}

function sigfunc() {
    let registry = []
    let cache = new Map();

    let f = function(...args) { return dispatch(registry, ...args) }

    f.register = function(arg) {
        cache.clear()
        registry.push(arg)
    }
    return f
}
function sigfunc() {
    let f = function(...args) { return dispatch(registry, ...args) }
    f.cache = new Map();
    f.registry = [];

    f.register = function(pattern, fn) {
        this.registry.push([pattern, new RegExp("^" + pattern + "$"), fn])
        // sort by length, big to small
        this.registry.sort((a, b) => b.length - a.length);
        console.log(registry);
    }
    return f
}

class OFunc {
   constructor() {
        this.cache = new Map()
        this.registry = new Array()
    }
    register(pattern, fn) {
        // invalidate cache
        this.cache.clear()
        this.registry.push([pattern, new RegExp("^" + pattern + "$"), fn])
    }
}

var R = new OFunc()
RGB.register("(Number ?){3,4}",
    function(a,b,c,d=1.0) {
        return new Expr("RGB", a,b,c,d);
    }
);


Clear(fn, pattern)

Overload(fn, pattern, function(a,b,c) {
    

})

Overload(CSSColor, "RGB", function() {


})


CSSColor(RGB(0.5, 0.5, 0.5))



export var RGB = sigfunc();
RGB.register("(Number ?){3,4}",
    function(a,b,c,d=1.0) {
        return new Expr("RGB", a,b,c,d);
    }
);
export var HSL = sigfunc();
HSL.register("(Number ?){3,4}",
    function(a,b,c,d=1.0) {
        return new Expr("HSL", a, b, c, d);
    }
);
export var Grayscale = sigfunc();
Grayscale.register("Number",
        function(a) {
            return new Expr("Grayscale", a)
        }
}
export var CSSColor = sigfunc();
CSSColor.register("RGB", function(val) {
    let rgbVal = Map((x) => ((Math.round(x *100)) + "%"), val) 

    // skip alpha - emit 3 values
    if (val[3] == 1.0) {
        return "rgb(" + Join(Take(rgbVal,3), " ") + ")"; 
    }

    // with alpha
    return "rgb(" + Join(Take(rgbVal, 3), " ") +
        "/" + Last(rgbVal) + ")"
});
// TBD: Alpha
CSSColor.register("HSL", function(val) {
    let cssval = Map((x) => (Math.round(x).toString()), val)
    return "hsl(" + Join(Take(cssval, 3), " ") + ")";
})

// assumes both inputs are RGBA
function blendRGBA(a, b, p) {
    return Apply(RGB, MapThread( (x,y) => (x + p*(y-x)), a, b))
}
function blendHSL(a,b,p) {
    let x =Apply(HSL, MapThread( (x,y) => (x + p*(y-x)), a, b))
    x[0] =a[0]
    return x
}

export var gradientCETDO1 = function(){
    let v = [
        0.128,0.316,0.858,
        0.147,0.320,0.859,
        0.164,0.325,0.860,
        0.179,0.329,0.861,
        0.194,0.333,0.862,
        0.207,0.338,0.863,
        0.220,0.342,0.864,
        0.232,0.346,0.864,
        0.243,0.351,0.865,
        0.254,0.355,0.866,
        0.264,0.360,0.867,
        0.274,0.364,0.868,
        0.284,0.369,0.869,
        0.294,0.373,0.869,
        0.303,0.377,0.870,
        0.312,0.382,0.871,
        0.321,0.386,0.872,
        0.329,0.391,0.873,
        0.337,0.395,0.874,
        0.346,0.400,0.874,
        0.354,0.404,0.875,
        0.362,0.409,0.876,
        0.369,0.414,0.877,
        0.377,0.418,0.878,
        0.384,0.423,0.878,
        0.392,0.427,0.879,
        0.399,0.432,0.880,
        0.406,0.436,0.881,
        0.413,0.441,0.882,
        0.420,0.446,0.882,
        0.427,0.450,0.883,
        0.434,0.455,0.884,
        0.440,0.460,0.885,
        0.447,0.464,0.886,
        0.454,0.469,0.886,
        0.460,0.474,0.887,
        0.467,0.478,0.888,
        0.473,0.483,0.889,
        0.479,0.488,0.889,
        0.485,0.492,0.890,
        0.492,0.497,0.891,
        0.498,0.502,0.892,
        0.504,0.507,0.892,
        0.510,0.511,0.893,
        0.516,0.516,0.894,
        0.522,0.521,0.895,
        0.528,0.526,0.895,
        0.534,0.530,0.896,
        0.540,0.535,0.897,
        0.545,0.540,0.898,
        0.551,0.545,0.898,
        0.557,0.550,0.899,
        0.563,0.555,0.900,
        0.568,0.559,0.900,
        0.574,0.564,0.901,
        0.580,0.569,0.902,
        0.585,0.574,0.903,
        0.591,0.579,0.903,
        0.596,0.584,0.904,
        0.602,0.588,0.905,
        0.607,0.593,0.905,
        0.613,0.598,0.906,
        0.618,0.603,0.907,
        0.623,0.608,0.907,
        0.629,0.613,0.908,
        0.634,0.618,0.909,
        0.639,0.623,0.909,
        0.645,0.628,0.910,
        0.650,0.633,0.911,
        0.655,0.638,0.911,
        0.660,0.643,0.912,
        0.666,0.648,0.913,
        0.671,0.653,0.913,
        0.676,0.658,0.914,
        0.681,0.663,0.915,
        0.686,0.668,0.915,
        0.691,0.673,0.916,
        0.697,0.678,0.917,
        0.702,0.683,0.917,
        0.707,0.688,0.918,
        0.712,0.693,0.918,
        0.717,0.698,0.919,
        0.722,0.703,0.920,
        0.727,0.708,0.920,
        0.732,0.713,0.921,
        0.737,0.718,0.921,
        0.742,0.723,0.922,
        0.747,0.728,0.923,
        0.752,0.733,0.923,
        0.757,0.738,0.924,
        0.762,0.743,0.924,
        0.766,0.748,0.925,
        0.771,0.754,0.926,
        0.776,0.759,0.926,
        0.781,0.764,0.927,
        0.786,0.769,0.927,
        0.791,0.774,0.928,
        0.796,0.779,0.928,
        0.801,0.784,0.929,
        0.805,0.789,0.929,
        0.810,0.795,0.930,
        0.815,0.800,0.930,
        0.820,0.805,0.931,
        0.825,0.810,0.932,
        0.829,0.815,0.932,
        0.834,0.821,0.933,
        0.839,0.826,0.933,
        0.844,0.831,0.934,
        0.848,0.836,0.934,
        0.853,0.841,0.935,
        0.858,0.846,0.935,
        0.863,0.852,0.935,
        0.867,0.857,0.936,
        0.872,0.862,0.936,
        0.877,0.867,0.936,
        0.881,0.872,0.937,
        0.886,0.876,0.937,
        0.890,0.881,0.936,
        0.895,0.885,0.936,
        0.899,0.890,0.936,
        0.903,0.893,0.935,
        0.908,0.897,0.934,
        0.912,0.900,0.932,
        0.916,0.903,0.931,
        0.919,0.905,0.928,
        0.923,0.906,0.926,
        0.926,0.907,0.923,
        0.929,0.907,0.919,
        0.932,0.907,0.915,
        0.935,0.905,0.911,
        0.937,0.904,0.906,
        0.939,0.901,0.900,
        0.941,0.898,0.895,
        0.942,0.895,0.888,
        0.944,0.891,0.882,
        0.945,0.887,0.875,
        0.946,0.882,0.869,
        0.946,0.877,0.861,
        0.947,0.872,0.854,
        0.947,0.866,0.847,
        0.948,0.861,0.840,
        0.948,0.855,0.832,
        0.948,0.849,0.825,
        0.948,0.843,0.817,
        0.948,0.837,0.810,
        0.948,0.831,0.802,
        0.948,0.825,0.794,
        0.948,0.819,0.787,
        0.948,0.813,0.779,
        0.947,0.807,0.772,
        0.947,0.800,0.764,
        0.947,0.794,0.757,
        0.947,0.788,0.749,
        0.946,0.782,0.742,
        0.946,0.776,0.734,
        0.945,0.770,0.727,
        0.945,0.764,0.719,
        0.944,0.758,0.712,
        0.944,0.752,0.704,
        0.943,0.746,0.697,
        0.942,0.740,0.689,
        0.942,0.733,0.682,
        0.941,0.727,0.675,
        0.940,0.721,0.667,
        0.940,0.715,0.660,
        0.939,0.709,0.653,
        0.938,0.703,0.645,
        0.937,0.697,0.638,
        0.936,0.691,0.631,
        0.935,0.685,0.623,
        0.934,0.679,0.616,
        0.933,0.673,0.609,
        0.932,0.666,0.601,
        0.931,0.660,0.594,
        0.930,0.654,0.587,
        0.929,0.648,0.580,
        0.928,0.642,0.573,
        0.927,0.636,0.565,
        0.925,0.630,0.558,
        0.924,0.624,0.551,
        0.923,0.618,0.544,
        0.922,0.612,0.537,
        0.920,0.605,0.530,
        0.919,0.599,0.522,
        0.917,0.593,0.515,
        0.916,0.587,0.508,
        0.915,0.581,0.501,
        0.913,0.575,0.494,
        0.912,0.569,0.487,
        0.910,0.562,0.480,
        0.908,0.556,0.473,
        0.907,0.550,0.466,
        0.905,0.544,0.459,
        0.904,0.538,0.452,
        0.902,0.531,0.445,
        0.900,0.525,0.438,
        0.898,0.519,0.431,
        0.897,0.513,0.424,
        0.895,0.507,0.417,
        0.893,0.500,0.410,
        0.891,0.494,0.403,
        0.889,0.488,0.396,
        0.887,0.481,0.390,
        0.885,0.475,0.383,
        0.884,0.469,0.376,
        0.882,0.463,0.369,
        0.880,0.456,0.362,
        0.878,0.450,0.355,
        0.875,0.443,0.349,
        0.873,0.437,0.342,
        0.871,0.431,0.335,
        0.869,0.424,0.328,
        0.867,0.418,0.322,
        0.865,0.411,0.315,
        0.863,0.405,0.308,
        0.860,0.398,0.301,
        0.858,0.391,0.295,
        0.856,0.385,0.288,
        0.854,0.378,0.281,
        0.851,0.372,0.275,
        0.849,0.365,0.268,
        0.846,0.358,0.261,
        0.844,0.351,0.255,
        0.842,0.344,0.248,
        0.839,0.337,0.241,
        0.837,0.331,0.235,
        0.834,0.323,0.228,
        0.832,0.316,0.222,
        0.829,0.309,0.215,
        0.827,0.302,0.208,
        0.824,0.295,0.202,
        0.821,0.287,0.195,
        0.819,0.280,0.188,
        0.816,0.272,0.182,
        0.813,0.265,0.175,
        0.811,0.257,0.169,
        0.808,0.249,0.162,
        0.805,0.241,0.155,
        0.803,0.233,0.148,
        0.800,0.224,0.142,
        0.797,0.216,0.135,
        0.794,0.207,0.128,
        0.791,0.198,0.121,
        0.788,0.189,0.115,
        0.786,0.179,0.108,
        0.783,0.169,0.101,
        0.780,0.159,0.093,
        0.777,0.148,0.086,
        0.774,0.137,0.079,
        0.771,0.124,0.071,
        0.768,0.111,0.064,
        0.765,0.096,0.056,
        0.762,0.080,0.047,
        0.759,0.061,0.039,
        0.756,0.036,0.030,
        0.752,0.008,0.022
    ];
    let colors = Map( (x) => Apply(RGB, x), Partition(v, 3))
    return function(p) {
        return colors[Math.round(p* colors.length)]
    }
}()

export function gradientRGBA(...colors) {
    return function(p) {
        if (colors.length === 0) {
            console.log("WHOOPS NO COLORS");
            return
        }
        if (p <= 0) {
            return colors[0]
        }
        if (p >= 1) {
            return colors.at(-1)
        }
        let interval = 1.0 / (colors.length -1);
        let index = Math.floor(p / interval);
        let np = (p - (index*interval)) / interval;
        return blendRGBA(colors[index], colors[index+1], np);
    }
}

export function gradientHSL(...colors) {
    return function(p) {
        if (colors.length === 0) {
            console.log("WHOOPS NO COLORS");
            return
        }
        if (p <= 0) {
            return colors[0]
        }
        if (p >= 1) {
            return colors.at(-1)
        }
        let interval = 1.0 / (colors.length -1);
        let index = Math.floor(p / interval);
        let np = (p - (index*interval)) / interval;
        return blendHSL(colors[index], colors[index+1], np);
    }
}
function gradientRGBAFunc(a, b) {
    return function(p){
        return gradientRGBA(a,b,p)
    }
}

export var  VisibleSpectrum = gradientRGBA(
    RGB(1,0,1),
    RGB(0,0,1),
    RGB(0,1,0),
    RGB(1,1,0),
    RGB(1,0,0)
);
export var GradientBlueWhiteRed = gradientRGBA(
    RGB(0,0,1),
    RGB(1,1,1),
    RGB(1,0,0),
);


export function HTMLEscape(str) {
    return str.toString().replaceAll("&", '&amp;')
        .replaceAll("<", '&lt;')
        .replaceAll(">", '&gt;')
        .replaceAll("\"", '&quot;')
        .replaceAll("'", '&#39;');
}
export function HTMLUnescape(str) {
    return str.replaceAll("&amp;", "&")
        .replaceAll("&lt;", "<")
        .replaceAll("&gt;", ">")
        .replaceAll("&quot;", "\"")
        .replaceAll("&#39;", "'");
}
export function HTMLTag(name, attrs={}, ...body){
    return StringJoin(
        "<" + name,
        Map(([k,v]) => (
            " " + k + "=\"" + HTMLEscape(v) + "\""
        ), Object.entries(attrs)), 
        ">",
        body,
        "</" + name + ">",
    )
}
export function Legend(n, colorfn) {
    const nbsp = String.fromCodePoint(0xA0);
    return StringJoin(
        "<table style='border-collapse:collapse'>\n",
        "<thead></thead>\n",
        "<tbody>\n",
        "<tr>\n",
        Map((i) => (
            HTMLTag("td", {},
                StringPadLeft(Math.round(100.0*i/n).toString(), 4, nbsp))
        ), Range(n)),
        "</tr>\n",
        "<tr>\n",
        Map( (i) => (
            HTMLTag("td",
                { style: "background:" + CSSColor(colorfn(i/n)),},
                nbsp)
        ), Range(n)),
        "</tr>\n",
        "</table>\n"
    )
}
export function ListDensityPlot(m, options) {
    const defaultOptions = {
        colorFunctionScaling: true,
        colorFunction: VisibleSpectrum,
    }
    const opts = { ...defaultOptions, ...options };

    return StringJoin(
        "<table class='ldp'>",
        "<thead></thead>\n",
        "<tbody>",
        Map( (row) => (
            [ "<tr>", 
                Map((cell) => (
                    HTMLTag("td",
                        { class: "cell",
                            style: "background:"+ CSSColor(opts.colorFunction(cell)),
                        }, "&nbsp;")
                ), row),
                "</tr>",
            ]
        ), m),
        "</tbody>",
        "</table>"
    ) 
}
