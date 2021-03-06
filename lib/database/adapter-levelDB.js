var __assign = (this && this.__assign) || Object.assign || function(t) {
    for (var s, i = 1, n = arguments.length; i < n; i++) {
        s = arguments[i];
        for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
            t[p] = s[p];
    }
    return t;
};
Object.defineProperty(exports, "__esModule", { value: true });
var lie_ts_1 = require("lie-ts");
var utilities_1 = require("../utilities");
var db_idx_1 = require("./db-idx");
var deleteFolderRecursive = function (path) {
    if (global._fs.existsSync(path)) {
        global._fs.readdirSync(path).forEach(function (file) {
            var curPath = path + "/" + file;
            if (global._fs.statSync(curPath).isDirectory()) { // recurse
                deleteFolderRecursive(curPath);
            }
            else { // delete file
                global._fs.unlinkSync(curPath);
            }
        });
        global._fs.rmdirSync(path);
    }
};
/**
 * Handles Level DB storage.
 *
 * @export
 * @class _LevelStore
 * @implements {NanoSQLStorageAdapter}
 */
// tslint:disable-next-line
var _LevelStore = /** @class */ (function () {
    function _LevelStore(path, writeCache, readCache) {
        this.path = path;
        this.writeCache = writeCache;
        this.readCache = readCache;
        this._pkKey = {};
        this._pkType = {};
        this._dbIndex = {};
        this._levelDBs = {};
        this._isPKnum = {};
    }
    _LevelStore.prototype.connect = function (complete) {
        var _this = this;
        utilities_1.fastALL(Object.keys(this._dbIndex), function (table, i, done) {
            var pks = [];
            _this._levelDBs[table].createKeyStream()
                .on("data", function (data) {
                pks.push(_this._isPKnum[table] ? new global._Int64BE(data).toNumber() : data);
            })
                .on("end", function () {
                if (pks.length) {
                    _this._dbIndex[table].set(pks);
                }
                done();
            });
        }).then(complete);
    };
    _LevelStore.prototype.disconnect = function (complete) {
        var _this = this;
        utilities_1.fastALL(Object.keys(this._dbIndex), function (table, i, done) {
            _this._levelDBs[table].close(done);
        }).then(function () {
            complete();
        });
    };
    _LevelStore.prototype.setID = function (id) {
        this._id = id;
        this._path = (this.path || ".") + "/db_" + this._id;
        if (!global._fs.existsSync(this._path)) {
            global._fs.mkdirSync(this._path);
        }
    };
    _LevelStore.prototype.makeTable = function (tableName, dataModels) {
        var _this = this;
        this._dbIndex[tableName] = new db_idx_1.DatabaseIndex();
        this._levelDBs[tableName] = global._levelup(global._leveldown(global._path.join(this._path, tableName)), {
            cacheSize: (this.readCache || 32) * 1024 * 1024,
            writeBufferSize: (this.writeCache || 32) * 1024 * 1024
        });
        dataModels.forEach(function (d) {
            if (d.props && utilities_1.intersect(["pk", "pk()"], d.props)) {
                _this._pkType[tableName] = d.type;
                _this._pkKey[tableName] = d.key;
                _this._isPKnum[tableName] = ["int", "number", "float"].indexOf(d.type) !== -1;
            }
            if (d.props && utilities_1.intersect(["ai", "ai()"], d.props) && utilities_1.intersect(["pk", "pk()"], d.props) && d.type === "int") {
                _this._dbIndex[tableName].doAI = true;
            }
        });
    };
    _LevelStore.prototype.write = function (table, pk, data, complete) {
        pk = pk || utilities_1.generateID(this._pkType[table], this._dbIndex[table].ai);
        if (!pk) {
            throw Error("Can't add a row without a primary key!");
        }
        if (this._dbIndex[table].indexOf(pk) === -1) {
            this._dbIndex[table].add(pk);
        }
        var r = __assign({}, data, (_a = {}, _a[this._pkKey[table]] = pk, _a));
        this._levelDBs[table].put(this._isPKnum[table] ? new global._Int64BE(pk).toBuffer() : pk, JSON.stringify(r), function (err) {
            if (err) {
                throw Error(err);
            }
            else {
                complete(r);
            }
        });
        var _a;
    };
    _LevelStore.prototype.delete = function (table, pk, complete) {
        var idx = this._dbIndex[table].indexOf(pk);
        if (idx !== -1) {
            this._dbIndex[table].remove(pk);
        }
        this._levelDBs[table].del(this._isPKnum[table] ? new global._Int64BE(pk).toBuffer() : pk, function (err) {
            if (err) {
                throw Error(err);
            }
            else {
                complete();
            }
        });
    };
    _LevelStore.prototype.read = function (table, pk, callback) {
        if (this._dbIndex[table].indexOf(pk) === -1) {
            callback(null);
            return;
        }
        this._levelDBs[table].get(this._isPKnum[table] ? new global._Int64BE(pk).toBuffer() : pk, function (err, row) {
            if (err) {
                throw Error(err);
            }
            else {
                callback(JSON.parse(row));
            }
        });
    };
    _LevelStore.prototype.rangeRead = function (table, rowCallback, complete, from, to, usePK) {
        var keys = this._dbIndex[table].keys();
        var usefulValues = [typeof from, typeof to].indexOf("undefined") === -1;
        var ranges = usefulValues ? [from, to] : [0, keys.length - 1];
        var rows = [];
        var lower = usePK && usefulValues ? from : keys[ranges[0]];
        var higher = usePK && usefulValues ? to : keys[ranges[1]];
        this._levelDBs[table]
            .createValueStream({
            gte: this._isPKnum[table] ? new global._Int64BE(lower).toBuffer() : lower,
            lte: this._isPKnum[table] ? new global._Int64BE(higher).toBuffer() : higher
        })
            .on("data", function (data) {
            rows.push(JSON.parse(data));
        })
            .on("end", function () {
            var idx = ranges[0] || 0;
            var i = 0;
            var getRow = function () {
                if (i < rows.length) {
                    rowCallback(rows[i], idx, function () {
                        idx++;
                        i++;
                        i % 500 === 0 ? lie_ts_1.setFast(getRow) : getRow(); // handle maximum call stack error
                    });
                }
                else {
                    complete();
                }
            };
            getRow();
        });
    };
    _LevelStore.prototype.drop = function (table, callback) {
        var _this = this;
        utilities_1.fastALL(this._dbIndex[table].keys(), function (pk, i, done) {
            _this._levelDBs[table].del(pk, done);
        }).then(function () {
            var idx = new db_idx_1.DatabaseIndex();
            idx.doAI = _this._dbIndex[table].doAI;
            _this._dbIndex[table] = idx;
            callback();
        });
    };
    _LevelStore.prototype.getIndex = function (table, getLength, complete) {
        complete(getLength ? this._dbIndex[table].keys().length : this._dbIndex[table].keys());
    };
    _LevelStore.prototype.destroy = function (complete) {
        var _this = this;
        utilities_1.fastALL(Object.keys(this._dbIndex), function (table, i, done) {
            _this.drop(table, function () {
                _this._levelDBs[table].close(done);
            });
        }).then(function () {
            deleteFolderRecursive(_this._path);
            complete();
        });
    };
    return _LevelStore;
}());
exports._LevelStore = _LevelStore;
