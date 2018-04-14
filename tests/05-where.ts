import { NanoSQLInstance } from "../src/index";
import { expect, assert } from "chai";
import "mocha";
import { usersDB, ExampleUsers, ExampleDataModel } from "./data";

describe("Where", () => {
    it("Select single row by primary key.", (done: MochaDone) => {
        usersDB(ExampleDataModel, (nSQL) => {
            nSQL.loadJS("users", ExampleUsers).then(() => {
                nSQL.table("users").query("select").where(["id", "=", 2]).exec().then((rows) => {
                    try {
                        expect(rows).to.deep.equal([{id: 2, name: "Jeb", age: 24, email: "jeb@gmail.com", meta: {value: 1}, posts: [1]}], "Single primary key select failed!");
                        done();
                    } catch (e) {
                        done(e);
                    }
                });
            });
        });
    });

    it("Select by inner object value.", (done: MochaDone) => {
        usersDB(ExampleDataModel, (nSQL) => {
            nSQL.loadJS("users", ExampleUsers).then(() => {
                nSQL.table("users").query("select").where(["posts.length", ">", 1]).exec().then((rows) => {
                    try {
                        expect(rows).to.deep.equal([
                            {id: 1, name: "Bill", age: 20, email: "bill@gmail.com", meta: {value: 1}, posts: [1, 3]},
                            {id: 3, name: "Bob", age: 21, email: "bob@gmail.com", meta: {value: 1}, posts: [1, 2, 3]}
                        ], "Select by inner object failed!");
                        done();
                    } catch (e) {
                        done(e);
                    }
                });
            });
        });
    });

    it("Select by intersection.", (done: MochaDone) => {
        usersDB(ExampleDataModel, (nSQL) => {
            nSQL.loadJS("users", ExampleUsers).then(() => {
                nSQL.table("users").query("select").where(["posts", "INTERSECT", [3]]).exec().then((rows) => {
                    try {
                        expect(rows).to.deep.equal([
                            {id: 1, name: "Bill", age: 20, email: "bill@gmail.com", meta: {value: 1}, posts: [1, 3]},
                            {id: 3, name: "Bob", age: 21, email: "bob@gmail.com", meta: {value: 1}, posts: [1, 2, 3]}
                        ], "Select by intersection failed!");
                        done();
                    } catch (e) {
                        done(e);
                    }
                });
            });
        });
    });

    it("Select single row with function.", (done: MochaDone) => {
        usersDB(ExampleDataModel, (nSQL) => {
            nSQL.loadJS("users", ExampleUsers).then(() => {
                nSQL.table("users").query("select").where(r => r.id === 2).exec().then((rows) => {
                    try {
                        expect(rows).to.deep.equal([{id: 2, name: "Jeb", age: 24, email: "jeb@gmail.com", meta: {value: 1}, posts: [1]}], "Single primary key select failed!");
                        done();
                    } catch (e) {
                        done(e);
                    }
                });
            });
        });
    });

    it("Select multiple rows by arbitrary value.", (done: MochaDone) => {
        usersDB(ExampleDataModel, (nSQL) => {
            nSQL.loadJS("users", ExampleUsers).then(() => {
                nSQL.table("users").query("select").where(["age", ">=", 21]).exec().then((rows) => {
                    try {
                        expect(rows).to.deep.equal([
                            {id: 2, name: "Jeb", age: 24, email: "jeb@gmail.com", meta: {value: 1}, posts: [1]},
                            {id: 3, name: "Bob", age: 21, email: "bob@gmail.com", meta: {value: 1}, posts: [1, 2, 3]}
                        ], "Multiple row select failed!");
                        done();
                    } catch (e) {
                        done(e);
                    }
                });
            });
        });
    });

    it("Select multiple rows using IN statement", (done: MochaDone) => {
        usersDB(ExampleDataModel, (nSQL) => {
            nSQL.loadJS("users", ExampleUsers).then(() => {
                nSQL.table("users").query("select").where(["age", "IN", [20, 21]]).exec().then((rows) => {
                    try {
                        expect(rows).to.deep.equal([
                            {id: 1, name: "Bill", age: 20, email: "bill@gmail.com", meta: {value: 1}, posts: [1, 3]},
                            {id: 3, name: "Bob", age: 21, email: "bob@gmail.com", meta: {value: 1}, posts: [1, 2, 3]}
                        ], "Multiple row select with IN failed!");
                        done();
                    } catch (e) {
                        done(e);
                    }
                });
            });
        });
    });

    it("Select multiple rows using BETWEEN statement", (done: MochaDone) => {
        usersDB(ExampleDataModel, (nSQL) => {
            nSQL.loadJS("users", ExampleUsers).then(() => {
                nSQL.table("users").query("select").where(["age", "BETWEEN", [19, 21]]).exec().then((rows) => {
                    try {
                        expect(rows).to.deep.equal([
                            {id: 1, name: "Bill", age: 20, email: "bill@gmail.com", meta: {value: 1}, posts: [1, 3]},
                            {id: 3, name: "Bob", age: 21, email: "bob@gmail.com", meta: {value: 1}, posts: [1, 2, 3]}
                        ], "Multiple row select with IN failed!");
                        done();
                    } catch (e) {
                        done(e);
                    }
                });
            });
        });
    });

    it("Select single row by secondary index.", (done: MochaDone) => {
        usersDB(ExampleDataModel, (nSQL) => {
            nSQL.loadJS("users", ExampleUsers).then(() => {
                nSQL.table("users").query("select").where(["name", "=", "Bill"]).exec().then((rows) => {
                    try {
                        expect(rows).to.deep.equal([
                            {id: 1, name: "Bill", age: 20, email: "bill@gmail.com", meta: {value: 1}, posts: [1, 3]}
                        ], "Seconday index select failed!");
                        done();
                    } catch (e) {
                        done(e);
                    }
                });
            });
        });
    });

    it("Select using AND statement.", (done: MochaDone) => {
        usersDB(ExampleDataModel, (nSQL) => {
            nSQL.loadJS("users", ExampleUsers).then(() => {
                nSQL.table("users").query("select").where([["name", "=", "Bill"], "AND", ["age", "=", 20]]).exec().then((rows) => {
                    try {
                        expect(rows).to.deep.equal([
                            {id: 1, name: "Bill", age: 20, email: "bill@gmail.com", meta: {value: 1}, posts: [1, 3]}
                        ], "Seconday index select failed!");
                        done();
                    } catch (e) {
                        done(e);
                    }
                });
            });
        });
    });

    it("Select using OR statement.", (done: MochaDone) => {
        usersDB(ExampleDataModel, (nSQL) => {
            nSQL.loadJS("users", ExampleUsers).then(() => {
                nSQL.table("users").query("select").where([["name", "=", "Bill"], "OR", ["age", "=", 21]]).exec().then((rows) => {
                    try {
                        expect(rows).to.deep.equal([
                            {id: 1, name: "Bill", age: 20, email: "bill@gmail.com", meta: {value: 1}, posts: [1, 3]},
                            {id: 3, name: "Bob", age: 21, email: "bob@gmail.com", meta: {value: 1}, posts: [1, 2, 3]}
                        ], "Seconday index select failed!");
                        done();
                    } catch (e) {
                        done(e);
                    }
                });
            });
        });
    });

    it("Select using (multiple) OR statements.", (done: MochaDone) => {
        usersDB(ExampleDataModel, (nSQL) => {
            nSQL.loadJS("users", ExampleUsers).then(() => {
                nSQL.table("users").query("select").where([["name", "=", "Bill"], "OR", ["age", "=", 21], "OR", ["email", "=", "jeb@gmail.com"]]).exec().then((rows) => {
                    try {
                        expect(rows).to.deep.equal([
                            {id: 1, name: "Bill", age: 20, email: "bill@gmail.com", meta: {value: 1}, posts: [1, 3]},
                            {id: 2, name: "Jeb", age: 24, email: "jeb@gmail.com", meta: {value: 1}, posts: [1]},
                            {id: 3, name: "Bob", age: 21, email: "bob@gmail.com", meta: {value: 1}, posts: [1, 2, 3]}
                        ], "Seconday index select failed!");
                        done();
                    } catch (e) {
                        done(e);
                    }
                });
            });
        });
    });

    it("Select using range.", (done: MochaDone) => {
        usersDB(ExampleDataModel, (nSQL) => {
            nSQL.loadJS("users", ExampleUsers).then(() => {
                nSQL.table("users").query("select").range(1, 2).exec().then((rows) => {
                    try {
                        expect(rows).to.deep.equal([
                            {id: 3, name: "Bob", age: 21, email: "bob@gmail.com", meta: {value: 1}, posts: [1, 2, 3]}
                        ], "Range select failed!");
                        done();
                    } catch (e) {
                        done(e);
                    }
                });
            });
        });
    });

    it("Select using trie.", (done: MochaDone) => {
        usersDB(ExampleDataModel, (nSQL) => {
            nSQL.loadJS("users", ExampleUsers).then(() => {
                nSQL.table("users").query("select").trieSearch("email", "bo").exec().then((rows) => {
                    try {
                        expect(rows).to.deep.equal([
                            {id: 3, name: "Bob", age: 21, email: "bob@gmail.com", meta: {value: 1}, posts: [1, 2, 3]}
                        ], "Trie select failed!");
                        done();
                    } catch (e) {
                        done(e);
                    }
                });
            });
        });
    });

});