$(document).ready(function(){
    $(".top img").css({
        "width" : "18%",
        "border" : "none",
        "padding":"0px 15px"
    });

    $(".top button").css({
        "margin":"20px 0px",
        "background-color":"#43762d",
        "border":"none"
    });
    $(".top h1").css({
        "font-size" : "70px"
    });
    $(".resumeColor").css({
        "color":"#43762d"
    });
    $(".topBtnP").css({
        "font-size":"20px",
        "line-height":"30px",
        "word-spacing":"5px",
        "padding-left":"60px"
    });
    $("#change").css({  
        "color":"#9c4242"
    });
    $(".sec_2").css({
        "background-color":"#acc5a040"
    })

    var text = ["Youtube", "Amazon", "Spotify","Uber", "Tesla", "Sony", "Apple", "Intel", "Delloite"];
    var counter = 0;
    var elem = $("#change");
    setInterval(change, 2000);
    function change() {
        elem.fadeOut(function(){
            elem.html(text[counter]);
            counter++;
            if(counter >= text.length) { counter = 0; }
            elem.fadeIn();
        });
        
    };

   
    




});




