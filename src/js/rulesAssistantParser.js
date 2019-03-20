// Implements a Top Down Operator Precedence parser, also know as a Pratt
// parser, after its "inventor", Vaughan Pratt.  The one implemented here
// closely follows what's presented here,
//     * http://javascript.crockford.com/tdop/tdop.html
// by Douglas Crockford, that uses that technique in JSLint.  Other relevant
// resources on the interweb
//     * http://effbot.org/zone/simple-top-down-parsing.htm
//     * http://eli.thegreenplace.net/2010/01/02/top-down-operator-precedence-parsing
//     * http://journal.stuffwithstuff.com/2011/03/19/pratt-parsers-expression-parsing-made-easy/
//     * https://higherlogics.blogspot.gr/2009/11/extensible-statically-typed-pratt.html
//     * https://github.com/fholm/Vaughan
//     * https://github.com/DasIch/pratt
// included here mostly as bookmarks for potential future reference.
//
// With regards to the lexer, I used the following with many changes
//     * http://eli.thegreenplace.net/2013/06/25/regex-based-lexical-analysis-in-python-and-javascript/
//
// Other useful things that I may not use any more but wouldn't want to lose,
//     * https://plainjs.com/javascript/utilities/merge-two-javascript-objects-19/
//     * https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Regular_Expressions


function panic(index, msg) {
    throw {index: index, message: msg};
}



var Lexer = function(skipWhitespace) {
    this.rules = [];
    this.index = 0;
    this.buffer = "";
    this.skipWhitespace = skipWhitespace ? /\S/ : null;
}

Lexer.prototype.addRule = function(id, defn) {
    var pattern = (defn && defn.pattern) || RegExp.escape(id);
    this.rules.push({
        id: id,
        pattern: new RegExp('^' + pattern)
    });
}

Lexer.prototype.feed = function(buffer) {
    this.buffer = buffer;
    this.index = 0;
}

Lexer.prototype.nextInterestingChar = function() {
    if (this.skipWhitespace) {
        var match = this.skipWhitespace.exec(this.buffer.substr(this.index));
        return match ? this.index + match.index
                     : this.buffer.length;
    }
    return this.index;
}

Lexer.prototype.next = function() {
    this.index = this.nextInterestingChar();

    if (this.index >= this.buffer.length)
        return { done: true };

    for (var i = 0; i < this.rules.length; ++i) {
        var rule = this.rules[i],
            match = rule.pattern.exec(this.buffer.substr(this.index));
        if (match) {
            var token = {
                id: rule.id,
                value: match[0],
                index: this.index,
            };
            this.index += token.value.length;
            return { done: false, value: token };
        }
    }

    panic(this.index, "illegal character");
}



var BaseSymbol = {
    lbp: 0,
    nud: function() { panic(this.index, "unexpected '" + this.id + "'"); },
    led: function() { panic(this.index, "not an operator"); }
};

var Parser = function(eofToken) {
    this.lexer = new Lexer(true);
    this.currentSymbol = null;

    this.eofToken = eofToken;
    this.symbolTable = {
        [this.eofToken]: Object.create(BaseSymbol, {id: {value: this.eofToken}})
    };
}

Parser.prototype.addSymbol = function(id, defn) {
    var s = this.symbolTable[id];
    if (s) {
        if (defn) {
            if (defn.lbp !== undefined) s.lbp = defn.lbp;
            if (defn.nud !== undefined) s.nud = defn.nud;
            if (defn.led !== undefined) s.led = defn.led;
        }
    } else {
        s = Object.create(BaseSymbol);
        s.id = id;
        if (defn && defn.lbp !== undefined) s.lbp = defn.lbp;
        if (defn && defn.nud) s.nud = defn.nud;
        if (defn && defn.led) s.led = defn.led;
        this.symbolTable[id] = s;
        this.lexer.addRule(id, defn);
    }
    return this;
}

Parser.prototype.addInfix = function(id, lbp, callback) {
    this.addSymbol(id, {
        lbp: lbp,
        led: function(p, left) { return callback(this, left, p.parse(lbp)); }
    });
    return this;
}

Parser.prototype.addInfixR = function(id, lbp, callback) {
    this.addSymbol(id, {
        lbp: lbp,
        led: function(p, left) { return callback(this, left, p.parse(lbp-1)); }
    });
    return this;
}

Parser.prototype.addPrefix = function(id, callback) {
    this.addSymbol(id, {
        // FIXME: this should not always be 70
        nud: function (p) { return callback(this, p.parse(70)); }
    });
    return this;
}

Parser.prototype.addConstant = function(id, callback) {
    this.addSymbol(id, {
        nud: function () { return callback(this); }
    });
    return this;
}

Parser.prototype.advance = function(id) {
    if (id !== undefined && this.currentSymbol.id !== id)
        panic(this.currentSymbol.index, "expected '" + id + "', got '" + this.currentSymbol.id + "'");

    var iter = this.lexer.next(),
        token = iter.value;
    if (iter.done)
        token = {
            id: this.eofToken,
            index: this.lexer.buffer.length
        };

    var symbol = this.symbolTable[iter.done ? this.eofToken : token.id];
    if (!symbol)
        panic(token.index, "unknown token '" + token.id + "'");

    var newSymbol = Object.create(symbol);
    newSymbol.value = token.value;
    newSymbol.index = token.index;
    return this.currentSymbol = newSymbol;
}

Parser.prototype.parse = function(rbp) {
    var symbol = this.currentSymbol;
    this.advance();
    var left = symbol.nud(this);

    rbp = rbp || 0;
    while (rbp < this.currentSymbol.lbp) {
        symbol = this.currentSymbol;
        this.advance();
        left = symbol.led(this, left);
    }
    return left;
}

Parser.prototype.parseString = function(string) {
    this.lexer.feed(string);
    this.advance();  // "kickstart" the lexer
    var result = this.parse();
    this.advance(this.eofToken);
    return result;
}



var ASTBuilder = function(eofToken) {
    this.parser = new Parser(eofToken);
}

ASTBuilder.prototype.addSymbol = function(id, extra) {
    this.parser.addSymbol(id, extra);
    return this;
}

ASTBuilder.prototype.addInfix = function(id, lbp) {
    this.parser.addInfix(id, lbp, function(symbol, left, right) {
        return {
            id: id,
            first: left,
            second: right,
        };
    });
    return this;
}

ASTBuilder.prototype.addInfixR = function(id, lbp) {
    this.parser.addInfixR(id, lbp, function(symbol, left, right) {
        return {
            id: id,
            first: left,
            second: right,
        };
    });
    return this;
}

ASTBuilder.prototype.addPrefix = function(id) {
    this.parser.addPrefix(id, function(symbol, left) {
        return {
            id: id,
            first: left,  // it's not really the left is it?
        };
    });
    return this;
}

ASTBuilder.prototype.addConstant = function(id, value) {
    this.parser.addConstant(id, function(symbol) {
        return {
            id: id,
            value: value,
        };
    });
    return this;
}


var op = {
    add: function(a, b) { return a + b; },
    sub: function(a, b) { return a - b; },
    mul: function(a, b) { return a * b; },
    div: function(a, b) { return a / b; },
    pow: function(a, b) { return Math.pow(a, b); },

    neg: function(a) { return -a; },

    lt: function(a, b) { return a < b; },
    le: function(a, b) { return a <= b; },
    gt: function(a, b) { return a > b; },
    ge: function(a, b) { return a >= b; },
    eq: function(a, b) { return a === b; },
    neq: function(a, b) { return a !== b; },

    not: function(a) { return !a; },
    or: function(a, b) { return a || b; },
    and: function(a, b) { return a && b; },
};

var parserBuilder = new ASTBuilder("(end)")
    // XXX: need to be first to not be recognised as a (name)
    .addConstant("true", true)
    .addConstant("false", false)

    .addSymbol("(number)", {
        pattern: "\\d+",
        nud: function() {
            return {
                id: "(number)",
                value: parseInt(this.value),
            };
        }
    })

    .addSymbol("(string)", {
        pattern: "\"(?:[^\\\\\"]|\\\\\"|\\\\(?!\"))*\"",
        nud: function(p) {
            return {
                id: "(string)",
                value: this.value.replace(/^\"|\"$/g, ""),
            };
        }
    })

    .addSymbol("(name)", {
        pattern: "[a-zA-Z]\\w*",
        nud: function(p) {
            return {
                id: "(name)",
                name: this.value,
            };
        }
    })

    .addInfix("+", 50,  op.add)
    .addInfix("-", 50,  op.sub)
    .addInfix("*", 60,  op.mul)
    .addInfix("/", 60,  op.div)
    .addInfixR("^", 70, op.pow)

    .addPrefix("-", op.neg)

    .addInfix("<=", 40, op.le)
    .addInfix("<",  40, op.lt)
    .addInfix(">=", 40, op.ge)
    .addInfix(">",  40, op.gt)
    .addInfix("!=", 40, op.neq)
    .addInfix("=",  40, op.eq)

    .addPrefix("!", op.not)
    .addInfix("||", 30, op.or)
    .addInfix("&&", 30, op.and)

    .addSymbol(")")
    .addSymbol("(", {
        nud: function(p) {
            var expr = p.parse(0);
            p.advance(")");
            return expr;
        }
    });

var parser = parserBuilder.parser;
window.parser = parser;

window.parseCondition = function(condition) {
    try {
        return {expr: parser.parseString(condition), error: null};
    } catch (e) {
        return {expr: null, error: e};
    }
}
