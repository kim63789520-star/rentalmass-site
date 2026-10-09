function getParamsFn() {
  var get_url = location.search.substr(location.search.indexOf("?") + 1);
  var object = {};

  if (get_url.indexOf("&") !== -1) {
    get_url = get_url.split("&");
    for (var i = 0; i < get_url.length; i++) {
      if (get_url[i].indexOf("=") !== -1) {
        var temp = get_url[i].split("=");
        object[temp[0]] = decodeURIComponent(temp[1]);
      }
    }
  } else {
    if (get_url.indexOf("=") !== -1) {
      var temp = get_url.split("=");
      object[temp[0]] = decodeURIComponent(temp[1]);
    }
  }
  return object;
}

function close_hotspot(id) {
  // console.log(id);
  // console.log($(id).parents("iframe"));
  $(id).stop().fadeOut();
}

function open_hotspot(id) {
  // console.log(id);
  // $("#hotspot_"+id).css("display","block");
  // if($("#vr_check").prop("checked") == true){
  // }
  $("#hotspot_" + id)
    .stop()
    .fadeIn();
}

function close_all_iframe() {
  // $("iframe").css("display","none");
  $("iframe.vr_modal").stop().fadeOut();
}

function myload(url) {
  $.ajax({
    type: "GET",
    url: url,
    beforeSend: function (request) {
      $("#ajax_indicator").show();
    },
    data: getParamsFn(),
    success: function (data) {
      $("#body").html(data);
      $("#ajax_indicator").fadeOut();
    },
    error: function (request, status, error) {
      $("#ajax_indicator").fadeOut();
      alert("오류가 발생 하였습니다.");
      history.back();
      // console.log('code: '+request.status+"\n"+'message: '+request.responseText+"\n"+'error: '+error);
    }
  });
}

function IE_Check() {
  var ua = window.navigator.userAgent;
  var msie = ua.indexOf("MSIE ");

  if (msie > 0 || !!navigator.userAgent.match(/Trident.*rv\:11\./)) {
    // If Internet Explorer, return version number
    return true;
  } else {
    return false;
  }
}

var IE = IE_Check();

if (IE) {
  alert(
    "구형 브라우저에서는 지원을 하지 않습니다. Chrome, Edge, Safari 등 다른 최신 브라우저를 사용해주세요."
  );
}

function open_modal(id) {
  $("#page_wrap").css({
    "overflow-y": "hidden"
  });
  $(`#${id}`).stop().fadeIn();
  $(".modal_bg").attr("onclick", `close_modal('${id}')`);
}

function close_modal(id) {
  $(`#${id}`).stop().hide();
  if (IE) {
    $("#page_wrap").css({
      "overflow-y": "auto"
    });
  } else {
    $("#page_wrap").css({
      "overflow-y": "initial"
    });
  }
}
