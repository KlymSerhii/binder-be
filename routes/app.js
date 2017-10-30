var express = require("express");
var router = express.Router();
var User = require("../models/user");
var Elective = require("../models/elective");
var Group = require("../models/group");
var Audience = require("../models/audience");

var nodemailer = require('nodemailer');

var transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'kpielective@gmail.com',
        pass: 'ljvyby8920'
    }
});


router.get("/", function (req, res, next) {
    res.render("index");
});

router.get("/getAllGroups", function (req, res, next) {
    Group.find()
        .exec(function (err, groups) {
            if (err) {
                return res.status(500).json({
                    title: "An error occured",
                    err: err
                })
            }
            res.status(200).json(groups);
        });
});

router.get("/getAllAudiences", function (req, res, next) {
    Audience.find()
        .exec(function (err, groups) {
            if (err) {
                return res.status(500).json({
                    title: "An error occured",
                    err: err
                })
            }
            res.status(200).json(groups);
        });
});

router.post("/addComment", function (req, res, next) {
    var rate = req.body.rate;
    var text = req.body.text;

    Elective.findById(req.body.electiveId, function (err, elective) {
        if (err) {
            return res.status(500).json({
                title: "An error occured",
                err: err
            })
        }

        var comment = new Comment({
            rate: rate,
            text: text,
            elective: elective,
            teacher: elective.author
        });

        comment.save(function (err, comment) {
            if (err) {
                return res.status(500).json({
                    title: "An error occured in saving elective",
                    err: err
                })
            }

            res.status(201).json(comment);


        });

    })
});



router.post("/sendNotifications", function (req, res, next) {
    var text = req.body.text;
    Elective.findById(req.params.electiveId, function (err, elective) {
        if (err) {
            return res.status(500).json({
                title: "Error!",
                error: err
            })
        }
        if (!elective) {
            return res.status(500).json({
                title: "No elective Found!"
            })
        }

        var electName = elective.name;

        User.find({_id: {$in: req.body.users}}, function (err, subscribers) {
            if (err) {
                return res.status(500).json({
                    title: "An error occured in finding subscribers",
                    err: err
                })
            }

            var emails = [];

            for (var i = 0; i < subscribers.length; i++) {
                emails.push(subscribers[i].email);
            }

            var stringEmails = emails.join(', ');

            var mailOptions = {
                from: 'kpielective@gmail.com',
                to: stringEmails,
                subject: 'Зміни в факультативі',
                text: text
            };

            transporter.sendMail(mailOptions, function(error, info){
                if (error) {
                    return res.status(500).json({
                        title: "An error occured in sending emails",
                        err: error
                    })
                } else {
                    res.status(200).json({title: 'Всьо збс', text: info});
                }
            });



        })
    });

    group.save(function (err, group) {
        if (err) {
            return res.status(500).json({
                title: "An error occured in saving group",
                err: err
            })
        }

        res.status(201).json(group);
    });
});

router.post("/addGroup", function (req, res, next) {
    var group = new Group({
        name: req.body.name
    });

    group.save(function (err, group) {
        if (err) {
            return res.status(500).json({
                title: "An error occured in saving group",
                err: err
            })
        }

        res.status(201).json(group);
    });
});

router.post("/addAudience", function (req, res, next) {
    var audience = new Audience({
        name: req.body.name
    });

    audience.save(function (err, audience) {
        if (err) {
            return res.status(500).json({
                title: "An error occured in saving audience",
                err: err
            })
        }

        res.status(201).json(audience);
    });
});


router.delete("/deleteGroup/:id", function (req, res, next) {
    Group.findById(req.params.id, function (err, group) {
        if (err) {
            return res.status(500).json({
                title: "Error!",
                error: err
            })
        }
        if (!group) {
            return res.status(500).json({
                title: "No group Found!"
            })
        }

        group.remove(function (err, group) {
            if (err) {
                return res.status(500).json({
                    title: "An error occured",
                    err: err
                })
            }

            res.status(200).json(group);
        });
    })
});

router.delete("/deleteAudience/:id", function (req, res, next) {
    Audience.findById(req.params.id, function (err, audience) {
        if (err) {
            return res.status(500).json({
                title: "Error!",
                error: err
            })
        }
        if (!audience) {
            return res.status(500).json({
                title: "No audience Found!"
            })
        }

        audience.remove(function (err, audience) {
            if (err) {
                return res.status(500).json({
                    title: "An error occured",
                    err: err
                })
            }

            res.status(200).json(audience);
        });
    })
});

router.post("/addUser", function (req, res, next) {

    var user = new User({
        login: req.body.login,
        password: req.body.password,
        name: req.body.name,
        surname: req.body.surname,
        email: req.body.email,
        dateOfBirth: req.body.dateOfBirth,
        role: req.body.role
    });

    Group.findById(req.body.group, function (err, group) {
        if (err) {
            return res.status(500).json({
                title: "An error occured",
                err: err
            })
        }

        user.group = group;

        user.save(function (err, result) {
            if (err) {
                return res.status(500).json({
                    title: "An error occured",
                    err: err
                })
            }
            res.status(201).json({
                message: "Saved user",
                obj: result
            })

        });
    })


});

router.get("/getAllUsers", function (req, res, next) {
    User.find()
        .exec(function (err, user) {
            if (err) {
                return res.status(500).json({
                    title: "An error occured",
                    err: err
                })
            }
            res.status(200).json(user);
        });
});

router.post("/addElective", function (req, res, next) {
    User.findById(req.body.author.id, function (err, user) {
        if (err) {
            return res.status(500).json({
                title: "An error occured",
                err: err
            })
        }

        var elective = new Elective({
            name: req.body.name,
            author: user,
            date: req.body.date,
            time: req.body.time,
            duration: req.body.duration,
            audience: req.body.audience,
            description: req.body.description,
            privateElective: req.body.privateElective
        });

        var subscribersId = req.body.subscribers;

        User.find({_id: {$in: subscribersId}}, function (err, subscribers) {
            if (err) {
                return res.status(500).json({
                    title: "An error occured in finding subscribers",
                    err: err
                })
            }

            elective.subscribers = subscribers;

            elective.save(function (err, elective) {
                if (err) {
                    return res.status(500).json({
                        title: "An error occured in saving elective",
                        err: err
                    })
                }

                res.status(201).json(elective);


            });
        })


    })
});


router.get("/getAllElectives", function (req, res, next) {
    Elective.find({})
        .populate("subscribers")
        .exec(function (err, electives) {
            if (err) {
                return res.status(500).json({
                    title: "An error occured",
                    err: err
                })
            }
            res.status(200).json(electives);
        });
});

router.patch("/patchElective/:id", function (req, res, next) {
    Elective.findById(req.params.id, function (err, elective) {
        if (err) {
            return res.status(500).json({
                title: "Error!",
                error: err
            })
        }
        if (!elective) {
            return res.status(500).json({
                title: "No Elective Found!"
            })
        }

        elective.name = req.body.name;
        elective.time = req.body.time;
        elective.duration = req.body.duration;
        elective.audience = req.body.audience;
        elective.description = req.body.description;
        elective.privateElective = req.body.privateElective;

        var subscribersId = req.body.subscribers;

        User.find({_id: {$in: subscribersId}}, function (err, subscribers) {
            if (err) {
                return res.status(500).json({
                    title: "An error occured in finding subscribers",
                    err: err
                })
            }

            elective.subscribers = subscribers;

            elective.save(function (err, elective) {
                if (err) {
                    return res.status(500).json({
                        title: "An error occured in saving elective",
                        err: err
                    })
                }

                res.status(201).json(elective);


            });
        })
    })
});

router.delete("/deleteElective/:id", function (req, res, next) {
    Elective.findById(req.params.id, function (err, elective) {
        if (err) {
            return res.status(500).json({
                title: "Error!",
                error: err
            })
        }
        if (!elective) {
            return res.status(500).json({
                title: "No Elective Found!"
            })
        }

        elective.remove(function (err, elective) {
            if (err) {
                return res.status(500).json({
                    title: "An error occured",
                    err: err
                })
            }

            res.status(200).json(elective);
        });
    })
});

router.post("/addSubscriberToElective", function (req, res, next) {
    var electiveId = req.body.electiveId;
    var userId = req.body.userId;

    User.findById(userId, function (err, user) {
        if (err) {
            return res.status(500).json({
                title: "Error, user not find!",
                error: err
            })
        }

        Elective.findById(electiveId, function (err, elective) {
            if (err) {
                return res.status(500).json({
                    title: "Error, elective nor find!",
                    error: err
                })
            }
            elective.subscribers.pull(user);
            elective.subscribers.push(user);

            elective.save(function (err, elective) {
                if (err) {
                    return res.status(500).json({
                        title: "An error occured",
                        err: err
                    })
                }

                res.status(200).json(elective);
            });

        })
    })

});

router.post("/deleteSubscriberToElective", function (req, res, next) {
    var electiveId = req.body.electiveId;
    var userId = req.body.userId;

    User.findById(userId, function (err, user) {
        if (err) {
            return res.status(500).json({
                title: "Error, user not find!",
                error: err
            })
        }

        Elective.findById(electiveId, function (err, elective) {
            if (err) {
                return res.status(500).json({
                    title: "Error, elective not find!",
                    error: err
                })
            }

            elective.subscribers.pull(user);

            elective.save(function (err, elective) {
                if (err) {
                    return res.status(500).json({
                        title: "An error occured",
                        err: err
                    })
                }

                res.status(200).json(elective);
            });

        })
    })

});


module.exports = router;
