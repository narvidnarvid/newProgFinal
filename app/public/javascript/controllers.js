
(function(){
    "use strict";
    myApp.controller("userCtrl",['$scope','socket', '$rootScope','$http', 'userService','$location', '$cookieStore','$window' , function($scope,socket ,$rootScope,$http,userService,$location, $cookieStore, $window) {
        var self = this;


        $rootScope.connected = false;
        // $rootScope.currentUser = {};
        $scope.loginError = false;
        $scope.haveTransactionData = false;
        // $scope.isAdmin = false;
        // $scope.currentUserId = undefined;

        // Limit the age
        var today = new Date();
        var minAge = 18;
        var maxAge = 120;
        $scope.minAge = new Date(today.getFullYear() - minAge, today.getMonth(), today.getDate());
        $scope.maxAge = new Date(today.getFullYear() - maxAge, today.getMonth(), today.getDate());

        //Get number online's pepole
        socket.on('counter', function (data) {
            $scope.socketCount = data.count;
        })

        // Register
        $scope.createNewUser = function() {
            this.userCtrl.user.role = "user";

            var emptyFieldAlert = false;

            // Check gender
            if(this.userCtrl.user.gender === undefined){
                emptyFieldAlert = true;
                swal('Error', 'Gender is required','error');
            }

            // Check marital status
            if(this.userCtrl.user.maritalStatus === undefined){
                emptyFieldAlert = true;
                swal('Error', 'Marital status is required','error');
            }

            // Check livig zone
            if(this.userCtrl.user.zone === undefined){
                emptyFieldAlert = true;
                swal('Error', 'Living zone is required','error');
            }


            // Create User if all field are ok
            if(!emptyFieldAlert) {
                userService.createUser(this.userCtrl.user).then(function(data,err) {
                    if(err){
                        console.log(err);
                    }else{
                        $rootScope.connected = true;
                        // Get the user data
                        userService.getUserByID(data.data.user._id).then(function(user,err) {
                            $rootScope.currentUser = user.data;

                            var expireDate = new Date();
                            expireDate.setDate(expireDate.getDate() + 1);

                            // Save the user
                            $cookieStore.put('currentUserId',user.data._id,{
                                expires: expireDate
                            });
                            // $cookieStore.put('currentUserId',user.data._id,{
                            //     expires: expireDate
                            // });

                            $location.path('/home');
                        });
                    }
                });
            }



        };

        // Login
        $scope.checkLoginUser = function() {
            var userEmail= this.userCtrl.userEmail;
            userService.checkUser(this.userCtrl.userEmail,this.userCtrl.userPassword).then(function(data,err) {

                if(err){
                    console.log(err);
                }else{
                    if(data.data){
                        $scope.loginError = false;
                        $rootScope.connected = true;
                        // Get the user data
                        userService.getUserByEmail(userEmail).then(function(user,err) {
                            $rootScope.currentUser = user.data;

                            var expireDate = new Date();
                            expireDate.setDate(expireDate.getDate() + 1);

                            // Save the user
                            $cookieStore.put('currentUserId',user.data._id,{
                                expires: expireDate
                            });
                        });
                        $location.path('/home');
                    }
                    else{
                        $scope.loginError = true;
                    }
                }
            });
        };

        // Logout
        $scope.logout = function () {
            $cookieStore.remove('currentUserId');
            $rootScope.currentUser = {};
            $scope.currentUserUpdate = {};
            $rootScope.connected = false;
            $scope.haveTransactionData = false;
            $rootScope.isAdmin = false;
            $scope.currentUserId = undefined;


        };

        if ($rootScope.connected || $cookieStore.get('currentUserId') !== undefined){

            $rootScope.connected = true;
            $scope.currentUserId = $cookieStore.get('currentUserId');

            userService.getUserByID($scope.currentUserId).then(function (data) {

                $rootScope.currentUser = data.data;

                // Check if admin
                if($rootScope.currentUser.role === 'admin') {
                    $rootScope.isAdmin = true;

                    // Get all users
                    userService.getAllUsers().then(function (data) {
                        $scope.appUsers = data;
                    });

                    // Delete user
                    $scope.deleteUser = function (id) {
                        // Check if the is admin and not deleting himself
                        if($rootScope.isAdmin && ( $scope.currentUserId !== id )){
                            // if (confirm('Are you sure you want delete?')) {
                            //     userService.deleteUser(id).then(function () {
                            //         userService.getAllUsers().then(function(data) {
                            //             $scope.appUsers = data;});
                            //     });
                            // }

                            swal({
                                title: 'Are you sure?',
                                text: "You won't be able to revert this!",
                                type: 'warning',
                                showCancelButton: true,
                                confirmButtonColor: '#3085d6',
                                cancelButtonColor: '#d33',
                                confirmButtonText: 'Yes, delete it!',
                                cancelButtonText: 'No, cancel!',
                                confirmButtonClass: 'btn btn-success',
                                cancelButtonClass: 'btn btn-danger',
                                buttonsStyling: false,
                                reverseButtons: true
                            }).then(function(result) {
                                if (result.value) {
                                    userService.deleteUser(id).then(function () {
                                        userService.getAllUsers().then(function(data) {
                                            $scope.appUsers = data;});
                                    });
                                    swal(
                                        'Deleted!',
                                        'The user has been deleted.',
                                        'success'
                                    )
                                }
                            })

                        }else {
                            swal(
                                'Error',
                                'You can\'t delete yourself...',
                                'error'
                            )
                        }
                    };

                    // Search Users
                    $scope.searchUsers = function () {
                        userService.searchUsers(this.userCtrl.searchUsers).then(function (data) {
                            $scope.appUsers = data;
                        });
                    };
                }



                // Update user
                $scope.updateThisUser = function () {
                    this.userCtrl.userToUpdate._id=$scope.currentUserId;
                    userService.updateUser(this.userCtrl.userToUpdate).then(function(data,err){
                        if(err){
                            console.log(err);
                        }
                        else{
                            swal(
                                'Saved Successfully',
                                'Your user details has been updated.',
                                'success'
                            )
                        }
                    })
                };

                //  Charts
                if($rootScope.currentUser.transactions.length > 0) {
                    $scope.haveTransactionData = true;

                    /*********************
                     * Bar Chart
                     * ******************/

                        // set the dimensions and margins of the graph
                    var margin = {top: 20, right: 20, bottom: 30, left: 40},
                        width = 960 - margin.left - margin.right,
                        height = 500 - margin.top - margin.bottom;

                    // set the ranges
                    var x = d3.scaleBand()
                        .range([0, width])
                        .padding(0.1);
                    var y = d3.scaleLinear()
                        .range([height, 0]);

                    // append the svg object
                    var svg = d3.select("#userTransactionBarChart").append("svg")
                        .attr("width", width + margin.left + margin.right)
                        .attr("height", height + margin.top + margin.bottom)
                        .append("g")
                        .attr("transform",
                            "translate(" + margin.left + "," + margin.top + ")");

                    var url = "/User/GetGroupById/" + $scope.currentUserId;

                    // Get the data
                    d3.json(url, function (error, data) {

                        if (data !== undefined) {
                            data = data.filter(function (i) {
                                return i.totalPrice;
                            });
                            data.sort(function (a, b) {
                                return b.totalPrice - a.totalPrice;
                            });

                            // Scale the range of the data in the domains
                            x.domain(data.map(function (d) {
                                return d._id.month + "/" + d._id.year + " " + d._id.catagory;
                            }));
                            y.domain([0, d3.max(data, function (d) {
                                return d.totalPrice;
                            })]);

                            if (error) throw error;
                            // append the rectangles for the bar chart
                            svg.selectAll(".bar")
                                .data(data)
                                .enter().append("rect")
                                .attr("class", "bar")
                                .attr("x", function (d) {
                                    return x(d._id.month + "/" + d._id.year + " " + d._id.catagory);
                                })
                                .attr("width", x.bandwidth())
                                .attr("y", function (d) {
                                    return y(d.totalPrice);
                                })
                                .attr("height", function (d) {
                                    return height - y(d.totalPrice);
                                });

                            // add the x Axis
                            svg.append("g")
                                .attr("transform", "translate(0," + height + ")")
                                .call(d3.axisBottom(x));

                            // add the y Axis
                            svg.append("g")
                                .call(d3.axisLeft(y));
                        }

                    });


                    /*********************
                     * End Bar Chart
                     * ******************/

                    /*********************
                     * Pie Chart
                     * ******************/


                    var widthPie = 960,
                        heightPie = 350,
                        radiusPie = Math.min(width, height) / 2;

                    var colorsPie = ["#778ca3", "#a5b1c2", "#8854d0", "#3867d6", "#2d98da", "#0fb9b1", "#20bf6b"];

                    var arcPie = d3.arc()
                        .outerRadius(radiusPie - 10)
                        .innerRadius(0);

                    var labelArc = d3.arc()
                        .outerRadius(radiusPie - 40)
                        .innerRadius(radiusPie - 40);

                    var pie = d3.pie()
                        .sort(null)
                        .value(function (d) {
                            return d.totalPrice;
                        });

                    var svgPie = d3.select("#userTransactionPieChart").append("svg")
                        .attr("width", widthPie + 100)
                        .attr("height", heightPie + 250)
                        .append("g")
                        .attr("transform", "translate(" + widthPie / 2 + "," + heightPie * 1.7 / 2 + ")");

                    var urlPie = "/User/GetGroupById/" + $scope.currentUserId;

                    d3.json(url, function (error, data) {

                        if (data !== undefined) {
                            data = data.filter(function (i) {
                                if (i._id.month === 12) {
                                    return i.totalPrice;
                                }
                            });
                            data.sort(function (a, b) {
                                return b.totalPrice - a.totalPrice;
                            });

                            if (error) throw error;

                            var g = svgPie.selectAll(".arc")
                                .data(pie(data))
                                .enter().append("g")
                                .attr("class", "arc");

                            g.append("path")
                                .attr("d", arcPie)
                                .style("fill", function (d, i) {
                                    return colorsPie[i];
                                });

                            g.append("text")
                                .attr("transform", function (d) {
                                    var _d = arcPie.centroid(d);
                                    _d[0] *= 2.5;	//multiply by a constant factor
                                    _d[1] *= 2.5;	//multiply by a constant factor
                                    return "translate(" + _d + ")";
                                })
                                .text(function (d) {
                                    return d.data._id.catagory;
                                });
                        }
                    });


                    /*********************
                     * End Pie Chart
                     * ******************/
                }

            });
        }

    }])

    myApp.controller("branchCtrl", function($scope,branchService) {
        var self = this;
        branchService.getAllBranches().then(function(data) {
            $scope.appBranches = data;});

        $scope.searchBranches = function () {
            branchService.searchBranches(this.branchCtrl.searchBranches).then(function (data) {
                console.log(data);
                $scope.appBranches = data;
            });
        };

        $scope.loadScript = function() {
            if(google == undefined) {
                var script = document.createElement('script');
                script.type = 'text/javascript';
                script.src = 'http://maps.googleapis.com/maps/api/js?key=AIzaSyDzEyJ0k3REy7R0YD5x6ag3o1epGPn8UK4&callback=initMap';
                document.body.appendChild(script);
                setTimeout(function () {
                    $scope.init();
                }, 500);
            }
            else {
                google.maps.event.addDomListener(window, 'load', $scope.initMap());
            }
        }
        $scope.initMap= function()  {
            var data = $.getJSON("Branches/GetAll", function(error, data)  {
            })

                .done(function () {
                    var locations = [];
                    for (var i = 0; i < data.responseJSON.length; i++){
                        locations.push({
                            "lat": data.responseJSON[i].Lattitude,
                            "lng": data.responseJSON[i].Longtidute,
                            "name": data.responseJSON[i].City,
                            "zoom": data.responseJSON[i].Zoom,
                            "description": data.responseJSON[i].Description
                        })
                    }
                    var center = {
                        "lat": locations[0].lat,
                        "lng": locations[0].lng
                    }
                    var map = new google.maps.Map(document.getElementById('map'), {
                        zoom: 8,
                        center: center
                    });
                    for (i = 0; i < locations.length; i++){
                        var contentString = locations[i].description;
                        var infowindow = new google.maps.InfoWindow({
                            content: contentString
                        });
                        var marker = new google.maps.Marker({
                            position: locations[i],
                            map: map,
                            title: locations[i].name
                        });
                        google.maps.event.addListener(marker, 'click', (function (marker, i) {
                            return function () {
                                infowindow.setContent(locations[i].description);
                                infowindow.open(map, marker);
                                var center = {
                                    "lat": locations[i].lat,
                                    "lng": locations[i].lng
                                }
                                var zoom = locations[i].zoom;
                                map.setCenter(center)
                                map.setZoom(zoom)
                            }
                        })(marker, i));
                    }
                })
                .fail(function () {
                    console.log("There was a problem loading the beaches locations");
                })
                .always(function () {
                });
        }
    })

    myApp.controller("articleCtrl", function($scope, $rootScope,$location ,articleService) {
        var self = this;
        articleService.getAllArticles().then(function(data) {
            $scope.appArticles = data.data;
        });

        $scope.getArticle = function (id) {
            articleService.getArticleByID(id).then(function (data) {
                $rootScope.appArticle = data.data;
                $location.path('/article');
            })

            // console.log($scope.appArticle.title);
        };


        // Update article
        $scope.updateArticleCount = function (currentArticle) {
            articleService.updateArticleCount(currentArticle).then(function(data,err){
                if(err){
                    console.log(err);
                }
            })
        };
    })

    myApp.controller("facebookCtrl", function($scope,$rootScope) {

        //Check if admin
        if($rootScope.currentUser.role === 'admin') {
            $rootScope.isAdmin = true;
        }

        // This is called with the results from from FB.getLoginStatus().
        function statusChangeCallback(response) {
            // console.log('statusChangeCallback');
            // console.log(response);
            // The response object is returned with a status field that lets the
            // app know the current login status of the person.
            if (response.status === 'connected') {
                // Logged into your app and Facebook.
                testAPI();
            } else {
                // console.log('error on loggin');
            }
        }

        window.fbAsyncInit = function() {
            FB.init({
                appId      : 279821755880431,
                cookie     : true,  // enable cookies to allow the server to access
                                    // the session
                xfbml      : true,  // parse social plugins on this page
                version    : 'v2.8' // use graph api version 2.8
            });

            FB.getLoginStatus(function(response) {
                statusChangeCallback(response);
            });
        };

        // Load the SDK asynchronously
        (function(d, s, id) {
            var js, fjs = d.getElementsByTagName(s)[0];
            if (d.getElementById(id)) return;
            js = d.createElement(s); js.id = id;
            js.src = "https://connect.facebook.net/en_US/sdk.js";
            fjs.parentNode.insertBefore(js, fjs);
        }(document, 'script', 'facebook-jssdk'));

        $scope.createPost= function(req, response) {
            FB.api(
                "/195893604336358/feed",
                "POST",
                {
                    "message": req,
                    "access_token": "EAADZBfxRcEZB8BAH3GtySk28BT9RZAZBmzUqp6sBGNZCo2Q2ZAJ1zgYb6u6uKNMaJvmFrHoTyJZCwIsLWBMaQZB9NAiwwhaAZA3eTx59eTBERN3D3xEcG2QAWysD9YtZABBHHYcmO6jlR6sjqXKbeqRcTM7ChbtMoGZCG00mWF2JqQqRZAEYOZCk5eGHkbPEksxgpgtkZD",
                },
                function (response) {
                    if (response && !response.error) {
                        /* handle the result */
                    }
                    swal({
                        title: 'Posted Successfully!',
                        text: "The post has been uploded.",
                        type: 'success',
                        showCancelButton: false,
                        confirmButtonColor: '#3085d6',
                        confirmButtonText: 'OK'
                    }).then(function(result) {
                        window.location.reload();
                    })
                }
            );

        }



//   $scope.getPosts= function(){
//   FB.api('/195893604336358/posts', function(response) {
//   console.log(response);
//   $scope.facebookPosts = response;
// });
//   }

        // Here we run a very simple test of the Graph API after login is
        // successful.  See statusChangeCallback() for when this call is made.
        function testAPI() {
            FB.api('/me', function(response) {
                // console.log('Successful login for: ' + response.name);
            });
        }
    })


    //angular.module('app').controller('userCtrl', ['$scope', 'userService', userCtrl])
    //angular.module('myApp').controller('userCtrl', ['$scope', 'userService', userCtrl])
})();