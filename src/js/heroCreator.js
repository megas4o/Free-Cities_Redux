window.getHeroSlave = function(heroSlave, baseHeroSlave) {
    console.log("getHeroSlave for", heroSlave)
    var newSlave = clone(baseHeroSlave);
    for (var attrname in heroSlave) {
        newSlave[attrname] = heroSlave[attrname];
    };
    console.log("returning ", newSlave);
    return newSlave;

}
