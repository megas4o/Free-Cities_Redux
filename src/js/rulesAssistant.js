function panic(message) {
    message = message || "panic";
    if (typeof Error !== "undefined") {
        throw new Error(message);
    }
    throw message;
}

function assert(condition, message) {
    if (!condition)
        panic(message || "Assertion failed");
}


window.isSimpleCondition = function(expr, validNames) {
    assert(validNames, "validNames was not given");

    switch (expr.id) {
    case "true": case "false":
        return true;

    case "<": case "<=": case ">": case ">=":
        return (
            expr.first.id === "(name)"              // first operand should be a name
            && validNames.includes(expr.first.name) // among the valid ones
            && expr.second.id === "(number)"        // and second should be a literal
        );

    case "&&": case "||":
        return (
            (expr.first.id == "<" || expr.first.id == "<=")
            && (expr.second.id == ">" || expr.second.id == ">=")
            && isSimpleCondition(expr.first, validNames)
            && isSimpleCondition(expr.second, validNames)
            && expr.first.first.name === expr.second.first.name
        );
    }
    return false;
}


window.getVariable = function(expr) {
    switch (expr.id) {
    case "true":
        return "always";
    case "false":
        return "none";
    case "<": case "<=": case ">": case ">=":
        return expr.first.name === "energy" ? "sex drive" : expr.first.name;
    case "&&": case "||":
        return getVariable(expr.first);
    }
}

window.changeVariable = function(expr, newVar) {
    //assert(isSimpleCondition(expr), "expr is not simple");

    switch (expr.id) {
    case "true": case "false":
        return {
            id: "<",
            first: {id: "(name)", name: newVar},
            second: {id: "(number)", value: 0}
        };

    case "<": case "<=": case ">": case ">=":
        expr.first.name = newVar;
        return expr;

    case "&&": case "||":
        expr.first.first.name = newVar;
        expr.second.first.name = newVar;
        return expr;
    }
}


window.changeComparison = function(expr, newComparison) {
    assert(expr.id !== "true" && expr.id !== "false", "expr is constant");
    //assert(isSimpleCondition(expr), "expr is not simple");

    var newOperand = {
        id: newComparison,
        first: {id: "(name)", name: expr.first.name},
        second: {id: "(number)", value: 0}
    };

    if (newComparison === "<" || newComparison === "<=") {
        switch (expr.id) {
        case "<": case "<=":
            expr.id = newComparison;
            return expr;
        case ">": case ">=":
            return { id: "&&", first: newOperand, second: expr };
        case "&&": case "||":
            expr.first.id = newComparison;
            return expr;
        }
    } else {
        switch (expr.id) {
        case "<": case "<=":
            return { id: "&&", first: expr, second: newOperand };
        case ">": case ">=":
            expr.id = newComparison;
            return expr;
        case "&&": case "||":
            expr.second.id = newComparison;
            return expr;
        }
    }
}

window.removeComparison = function(expr, comparisonType) {
    assert(expr.id !== "true" && expr.id !== "false", "expr is constant");
    //assert(isSimpleCondition(expr), "expr is not simple");
    assert(comparisonType === "lower" || comparisonType === "upper",
           "invalid comparisonType '" + comparisonType + "'");

    if (comparisonType === "lower") {
        switch (expr.id) {
        case "<": case "<=":
            return expr;
        case ">": case ">=":
            return { id: "true" };
        case "&&": case "||":
            return expr.first;
        }
    } else {
        switch (expr.id) {
        case "<": case "<=":
            return { id: "false" };
        case ">": case ">=":
            return expr;
        case "&&": case "||":
            return expr.second;
        }
    }
}


window.changeConnective = function(expr, newConnective) {
    switch (expr.id) {
    case "true": case "false":
    case "<": case "<=": case ">": case ">=":
        return expr;
    case "&&": case "||":
        expr.id = newConnective;
        return expr;
    }
}


window.unparseExpr = function(expr) {
    switch (expr.id) {

    // literals
    case "true":
        return "true";
    case "false":
        return "false";
    case "(number)": case "(string)":
        return expr.value;

    // names
    case "(name)":
        return expr.name;

    // logical infix operators
    case "&&": case "||":
    // numerical infix comperators
    case "<": case "<=":
    case ">": case ">=":
    case "=": case "!=":
    // numerical infix operators (excluding minus)
    case "+": case "*": case "/": case "^":
        return [unparseExpr(expr.first),
                expr.id,
                unparseExpr(expr.second)].join(" ");

    // unary/prefix operators
    case "!":
        return expr.id + unparseExpr(expr.first);

    case "-":
        if (expr.second !== undefined) {
            return unparseExpr(expr.first) + " - " + unparseExpr(expr.second);
        } else {
            return "-" + unparseExpr(expr.first);
        }

    // parentheses
    case "(":
        return "(" + unparseExpr(expr.first) + ")";
    }

    panic("how did I get here? unknown expr.id: " + expr.id);
}

window.typeExpr = function(expr, env) {
    switch (expr.id) {

    case "true": case "false":
        return "bool";
    case "(number)":
        return "number";
    case "(string)":
        return "string";

    case "(name)":
        return env[expr.name];

    case "&&": case "||":
        return "bool";

    case "<": case "<=":
    case ">": case ">=":
        return "bool";
    case "=": case "!=":
        return "bool";

    case "*": case "/":  case "^":
        return "number";

    case "+":
        return typeExpr(expr.first, env) === "string" ? "string" : "number";

    case "!":
        return typeExpr(expr.first, env);
    case "-":
        if (expr.second !== undefined) {
            return "number";
        } else {
            return typeExpr(expr.first, env);
        }

    case "(":
        return typeExpr(expr.first, env);
    }
}

window.evalExpr = function(expr, env) {
    switch (expr.id) {

    case "true":
        return true;
    case "false":
        return false;
    case "(number)":
        return expr.value;
    // Literal strings are stored as "value" with the literal quotes inside
    // the string. This is useful for printing, but we need to strip them
    // when we are evaluating them.
    case "(string)":
	return expr.value.replace(/^["']/, "").replace(/['"]$/, "");

    case "(name)":
        return env[expr.name];

    case "&&":
        return evalExpr(expr.first, env) && evalExpr(expr.second, env);
    case "||":
        return evalExpr(expr.first, env) || evalExpr(expr.second, env);
    case "<":
        return evalExpr(expr.first, env) < evalExpr(expr.second, env);
    case "<=":
        return evalExpr(expr.first, env) <= evalExpr(expr.second, env);
    case ">":
        return evalExpr(expr.first, env) > evalExpr(expr.second, env);
    case ">=":
        return evalExpr(expr.first, env) >= evalExpr(expr.second, env);
    case "=":
        return evalExpr(expr.first, env) == evalExpr(expr.second, env);
    case "!=":
        return evalExpr(expr.first, env) != evalExpr(expr.second, env);

    case "+":
        return evalExpr(expr.first, env) + evalExpr(expr.second, env);
    case "*":
        return evalExpr(expr.first, env) * evalExpr(expr.second, env);
    case "/":
        return evalExpr(expr.first, env) / evalExpr(expr.second, env);
    case "^":
        return Math.pow(evalExpr(expr.first, env), evalExpr(expr.second, env));

    case "!":
        return !evalExpr(expr.first, env);
    case "-":
        if (expr.second !== undefined) {
            return evalExpr(expr.first, env) - evalExpr(expr.second, env);
        } else {
            return -evalExpr(expr.first, env);
        }

    case "(":
        return evalExpr(expr.first, env);
    }
}


window.optimizeExpr = function(expr) {
    switch (expr.id) {
    case "true": case "false":
    case "(number)": case "(string)":
    case "(name)":
        return expr;

    case "-":
        // The only "optimization" we are doing.  Obviously, this is not done
        // for the sake of speed, rather, to make the UI and isSimpleCondition
        // simpler, since they don't have to explicitly check for negative
        // numbers.
        if (expr.second === undefined && expr.first.id === "(number)")
            return {id: "(number)", value: evalExpr(expr)};
        // fallthrough, if the minus was not unary

    case "&&": case "||":
    case "<": case "<=": case ">": case ">=":
    case "=": case "!=":
    case "+": case "*": case "/": case "^":
        return {
            id: expr.id,
            first: optimizeExpr(expr.first),
            second: optimizeExpr(expr.second)
        };

    case "!": case "(":
        return {
            id: expr.id,
            first: optimizeExpr(expr.first)
        };
    }
}

window.printError = function(exprStr, error) {
    var result = [],
        inError = false;
    for (var i = 0; i < exprStr.length; i++) {
        if (i === error.index)
            result.push("@@.red;");
        result.push(exprStr[i]);
    }
    result.push("@@");
    return result.join("");
}
