/**
 * FileUploader
 * @param name
 * @param options
 */
function FileUploader(name, options){
	var that = this;
	//동적으로 DOM 생성을 위한 id값
	this.upZoneId = name;
	this.imgDivId = name + "img";
	this.uploadPopupId = name + "pop";
	this.btnUploadId = name + "btnUpload";
	this.closePopupId = name + "closeUploadPopup";
	this.progressId = name + "progress";
	this.dragMsgId = name + "msg";
	this.sendSpeedId = name + "speed";

	this.sendTimer = null;
	var isSending = false;
	//저장 파일 리스트
	this.files = [];
	var defaults = {
		sendMethod : 3     //1:순차전송, 2:모두전송, 3:분할전송
	}
	$.extend(defaults, options);

	var localSetting = null;
	$.getJSON("setting.json", function(data){
		localSetting = data;
		console.log(localSetting);
	});

	var popStr = "<div id='" + this.uploadPopupId + "' class='widget-box uploadPopup'>"
			+ "<div class='widget-header'>"
			+ "<h4>FIlE UPLOADER</h4>"
			+ "<div class='floatRight vCenter' style='margin:5px'>"
			+ "<span id='" + this.sendSpeedId + "' style='margin-right:10px;'></span>"
			+ "<a type='button' id='" + this.btnUploadId + "' class='sendBtn'><i class='glyphicon glyphicon-open' style='font-size:2.5em;'></i></a>"
			+ "<a id='" + this.closePopupId + "' class='uploadClosePopup sendBtn'><i class='glyphicon glyphicon-remove' style='font-size:2.5em;''></i></a>"
			+ "</div></div>"
			+ "<div class='widget-body uploadWidget'>"
			+ "<table id='tbl' class='table'><thead><tr>"
			+ "<th width='10%'>번호</th><th width='40%'>파일제목</th>"
			+ "<th width='15%'>파일사이즈</th><th width='25%'>상태</th><th width='10%'>취소</th>"
			+ "</tr></thead><tbody></tbody></table>"
			+ "</div><input type='file' style='display:none;' multiple/>"
			+ "</div>";
	$("body").append(popStr);

	this.upZoneDom = $("#" + this.upZoneId);
	this.upZoneDom.append("<div id='"+ this.imgDivId +"'></div>");

	var msgStr = "<div class='dragParentMsg'>"
		+ "<div id='" + this.dragMsgId + "' class='dragMsg'>"
		+ "<div>파일을 다음 폴더에 바로 업로드하려면 여기에 드롭하세요</div>"
		+ "<div class='dragAni'><i class='fa fa-cloud-download'></i></div>"
		+ "</div></div>";
	this.upZoneDom.append(msgStr);

	this.dragMsgDom = $("#" + this.dragMsgId);
	this.dragMsgParentDom = this.dragMsgDom.parent();
	this.uploadPopupDom = $("#" + this.uploadPopupId);

	$(document).on("ready", function(){
		that.setDragMsgPosition();
		that.setUploadPopupPosition();

		that.dragMsgParentDom.hide();

		//Bind Event
		that.upZoneDom.bind("drop", that.fileDrop);
		that.upZoneDom.bind("dragover", that.fileDragover);
		that.upZoneDom.bind("dragenter", that.fileDragenter);
		that.upZoneDom.bind("dragleave", that.fileDragLeave);
		that.upZoneDom.bind("click", function(){
			$("#" + that.uploadPopupId + " [type=file]").click();
		});
		$("#" + that.uploadPopupId + " [type=file]").bind("change", that.fileDrop);

		that.uploadPopupDom.draggable({
			'handle' : '.widget-header'
		});
		that.uploadPopupDom.hide();
		$('.progress .progress-bar').progressbar({
			display_text : 'fill'
		});

		if (defaults.sendMethod == 1){
			$("#" + that.btnUploadId).click(that.startUploadByTurn); //순차적으로 전송
		} else if (defaults.sendMethod == 2) {
			$("#" + that.btnUploadId).click(that.uploadFiles); //여러개 한번에 전송
		} else if (defaults.sendMethod == 3) {
			$("#" + that.btnUploadId).click(that.sliceUploadByTurn); //workerUploadByTurn
		}
		$("#" + that.closePopupId).click(that.closeUploadPopup);
	});

	$(window).resize(function(){
		//that.setDragMsgPosition();
		that.setUploadPopupPosition();


	});

	// 드래그메시지창 위치값 세팅
	this.setDragMsgPosition = function(){
		that.dragMsgParentDom.css("width", that.upZoneDom.innerWidth());
		that.dragMsgParentDom.css("height", that.upZoneDom.innerHeight());
		var msgParentLeft = parseFloat(that.upZoneDom.offset().left + ((that.upZoneDom.outerWidth() - that.upZoneDom.innerWidth()) / 2));
		var msgParentTop = parseFloat(that.upZoneDom.offset().top + ((that.upZoneDom.outerHeight() - that.upZoneDom.innerHeight()) / 2));
		that.dragMsgParentDom.css("left", msgParentLeft);
		that.dragMsgParentDom.css("top", msgParentTop);
		var boxWidth = Number(that.dragMsgParentDom.innerWidth());
		var boxHeight = Number(that.dragMsgParentDom.innerHeight());
		var msgWidth = Number(that.dragMsgDom.innerWidth());
		var msgHeight = Number(that.dragMsgDom.innerHeight());
		that.dragMsgDom.css("left", (boxWidth / 2) - (msgWidth / 2));
		that.dragMsgDom.css("top", (boxHeight / 2) - (msgHeight / 2));
	}

	// 업로드 팝업 위치값 세팅
	this.setUploadPopupPosition = function(){
		that.uploadPopupDom.css("top", window.innerHeight - that.uploadPopupDom.height() - 10 + "px");
		that.uploadPopupDom.css("left", window.innerWidth - that.uploadPopupDom.width() - 20 + "px");

	}

/*-----------Drop Function----------*/
	this.fileDrop = function(e) {
		that.dragMsgParentDom.fadeOut();
		that.uploadPopupDom.fadeIn();

		switch(e.type){
		case "drop":
			for(var i = 0; i < e.originalEvent.dataTransfer.files.length; i++){
				var file = e.originalEvent.dataTransfer.files[i];
				fileSetting(file);
			}
			break;
		case "change":
			for(var i = 0; i < e.target.files.length; i++){
				var file = e.target.files[i];
				fileSetting(file);
			}
			break;
		}

		e.originalEvent.stopPropagation();
		e.originalEvent.preventDefault();
	}

	function fileSetting(file){
		file.isSending = false;
		file.isSend = false;
		file.isCancel = false;
		file.sendPercent = 0;
		that.drawFileList(file, that.files.length);
		that.deleteEvent(file, that.files.length);
		that.files.push(file);
	}

	this.drawFileList = function(file, index){
		var src = "<tr id='trans_" + index + "'>";
		src += "<td align='center'>" + (index + 1) + "</td>";
		src += "<td><span>" + file.name + "</span></td>";
		src += "<td align='center'>" + Math.round(file.size / (1024 * 1024 / 100)) / 100 + "MB</td>";
		src += "<td align='center'>";
			src += "<div id='" + that.progressId + "' class='progress' ><div id='"+ that.progressId + index;
			src += "' class='progress-bar' role='progressbar' data-transitiongoal='100' ";
			src += "style='width:";
			if(file.isCancel && !file.isSend){
				src += "0";
			} else {
				src += file.sendPercent;
			}
			src += "%;z-index:1;background:#41FF3A;'>";
			src += "</div>";
			src += "<div style='position:absolute;width:100%;z-index:2;font-weight:bold;'>";
			if(file.isCancel && !file.isSend){
				src += "<span>업로드취소</span>";
			} else if(file.isSending) {
				src += file.sendPercent + "%"
			}
			src += "</div>";
		src += "</td>";
		src += "<td align='center'>";
		if(!file.isSend){
			if(!file.isCancel){
				src += "<i class='fa-times delete_btn'></i>";
			}
		}
		src += "</td><tr>";
		$("#" + that.uploadPopupId +" table tbody").append(src);
	}

/**-----------------------------Drag Message Event Functions-----------------------------------------------------**/
	var dragTarget = null;
	this.fileDragenter = function(e) {
		that.dragTarget = e.originalEvent.target;
		that.setDragMsgPosition();
		that.dragMsgParentDom.fadeIn();

		e.originalEvent.stopPropagation();
		e.originalEvent.preventDefault();
	}

	this.fileDragover = function(e) {
		e.originalEvent.stopPropagation();
		e.originalEvent.preventDefault();
	}

	this.fileDragLeave = function(e){
		if(e.originalEvent.target == that.dragTarget){
			that.dragMsgParentDom.fadeOut();
		}

		e.originalEvent.stopPropagation();
		e.originalEvent.preventDefault();
	}
/**---------------------------------------------------------------------------------------------------------------**/

/**---------------------------Uploade Popup Event Functions-------------------------------------------------------**/
	this.deleteEvent = function(file, index){
		var currTransId = "#" + that.uploadPopupId +" #trans_" + index + " i";
		$(document).off("click", currTransId);
		$(document).on("click", currTransId, function(e){
			if(file.isSend) return;
			if(file.isSending){
//				if(defaults.sendMethod == 3){
//					file.worker.postMessage({ //worker에 취소 요청
//						type: 'abort'
//					});
//				}else{
				clearTimeout(that.sendTimer);
				file.xhr.abort();
				var nEnd =  new Date().getTime();      //종료시간 체크(단위 ms)
				var nDiff = nEnd - nStart;      //두 시간차 계산(단위 ms)
				console.log(Math.floor(nDiff/1000/60) + "분 " + Math.floor((nDiff/1000) - Math.floor(nDiff/1000/60)*60) + "초 ");
//				}
				file.isCancel = true;
				isSending = false;

				if(file.isCancel){
					$("#" + that.uploadPopupId +" #trans_" + index + " i").remove(); // X버튼 삭제
				}
			}else{
				that.files.splice(index, 1);
			}
			that.reDrawFileList();
		});
	}

	this.reDrawFileList = function(){
		$("#" + that.uploadPopupId + " table tbody").html("");
		for(var i = 0; i < that.files.length; i++){
			var file = that.files[i];
			that.drawFileList(file, i);
			that.deleteEvent(file, i);
		}
	}

	this.closeUploadPopup = function(){
		that.uploadPopupDom.fadeOut();
	}
/**-----------------------------------------------------------------------------------------------------------------**/

/**----------------------------Upload Functions---------------------------------------------------------------------**/

/*-----------------sliceUpload-----------------*/
	var nStart; //시간재기
	var previous;
	var previous_time;
	var delayCount = 0;
	this.fileSliceUpload = function(file, index, sliceNum){
 		var BYTES_PER_CHUNK = 512 * 1024 / 10;
 		var uploadUrl = localSetting.uploadUrl;
 		var chunkCount = file.size / BYTES_PER_CHUNK;

 		if(chunkCount < sliceNum){
 			//merge(file.name, Math.ceil(chunkCount), index);
 			var nEnd =  new Date().getTime();      //종료시간 체크(단위 ms)
 			var nDiff = nEnd - nStart;      //두 시간차 계산(단위 ms)
   			console.log(Math.floor(nDiff/1000/60) + "분 " + Math.floor((nDiff/1000) - Math.floor(nDiff/1000/60)*60) + "초 ");
			$("#" + that.uploadPopupId +" #trans_" + index + " i").remove(); // X버튼 삭제
	        $("#" + that.sendSpeedId).html(((previous / 1024 / 1024) / (nDiff / 1000)).toFixed(2) + "MB/s");
			file.isSend = true;
			isSending = false;
			index++;
			if(that.files.length == index) return;
			that.sliceUpload(that.files[index], index);
			return;
		}

		var start = BYTES_PER_CHUNK * sliceNum; //시작위치
		var end = start + BYTES_PER_CHUNK; //시작부터 지정한 바이트크기 만큼
		var chunk = file.slice(start, end); //자르기
		var str = uploadUrl + '?fileName=' + encodeURIComponent(file.name) + '&chunkNumber=' + sliceNum;

		var xhr = new XMLHttpRequest();
		xhr.open('POST', str, true);

		xhr.upload.onprogress = function(e) {
			var percentage = Math.round(((e.loaded / BYTES_PER_CHUNK) + sliceNum) * 100 / chunkCount);
			file.sendPercent = percentage;
			$("#" + that.progressId + index).width(percentage + '%');
		    $("#" + that.progressId + index).next().text(percentage + '%');

		    if(delayCount++ % 5 == 3){
		        //속도계산
		        var now = (BYTES_PER_CHUNK * sliceNum) + e.loaded;
		        var now_time = Date.now();
		        var diff = ((now - previous) / 1024 / 1024); // 전송량(MB)
		        var diff_time = ((now_time - previous_time) / 1000); // 시간(s)
		        previous = now;
		        previous_time = now_time;
		        $("#" + that.sendSpeedId).html((diff / diff_time).toFixed(2) + "MB/s");
	        }
		};

		xhr.onload = function(e) {
			//다음 전송 속도 제어
			that.sendTimer = setTimeout(function(){
				that.fileSliceUpload(file, index, ++sliceNum); //완료되면 다음
			}, 100);
		};

		xhr.onerror = function(e) {
			console.log(e);
			file.isSending = false;
	    	xhr.abort();
		}

		xhr.ontimeout = function(e){
			console.log("timeout!");
			//xhr.send(chunk);
		}

	    if(xhr.timeout == 0) xhr.timeout = 60000;
		file.xhr = xhr;
		file.isSending = true;
		xhr.send(chunk);
	}

	this.sliceUpload = function(file, index) {
		nStart = new Date().getTime();     //시작시간 체크(단위 ms)
		if(file.isSending || file.isSend || file.isCancel){
			var i = index + 1;
			if(that.files.length == i) return;
			that.sliceUpload(that.files[i], i);
			return;
		}
		if(!file.isSend){
			$(".uploadWidget").scrollTop($("#trans_" + index).height() * (index + 3.5) - $(".uploadWidget").height());
		}
		previous = 0;
		previous_time = 0;
		isSending = true;
		that.fileSliceUpload(that.files[index], index, 0);
	}

	this.sliceUploadByTurn = function(){
		if(isSending) return;
		if(that.files.length < 0) return;
		var index = 0;
		that.sliceUpload(that.files[index], index);
	}

//	function merge(name, count, index){
//		var str = localSetting.serverUrl + '/api/upload/simpleMerge'
//			+ '?fileName=' + encodeURIComponent(name)
//			+ '&total=' + count;
//		var xhr = new XMLHttpRequest();
//		xhr.open('GET', str, true);
//		xhr.onload = function(e) {
//			that.files[index].isSend = true;
//		};
//		xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded; charset=UTF-8');
//		xhr.send();
//	}

/*---------------------------------------------*/

/*------------------여러개 전송-------------------*/
	this.uploadFiles = function() {
		for (var i = 0; i < that.files.length; i++) {
			that.sliceUpload(that.files[i], i);
		}
	}
//
//	this.uploadFile = function(file, index){
//		if(file.isSending || file.isSend || file.isCancel) return;
//		var xhr = new XMLHttpRequest();
//		xhr.ontimeout = function(e){
//			xhr.abort();
//		}
//		xhr.upload.onprogress = function(e){
//			var percentComplete = Math.round(e.loaded * 100 / e.total);
//			file.sendPercent = percentComplete;
//			$("#" + that.progressId + index).width(percentComplete + '%');
//	        $("#" + that.progressId + index).text(percentComplete + '%');
//		}
//		xhr.onload = function(e){
//			file.isSend = true;
//			var data = JSON.parse(e.target.responseText);
//			that.successUpload(data);
//		}
//	    xhr.onerror = function(e){
//			file.isSending = false;
//	    	xhr.abort();
//	    	that.failUpload(e);
//	    }
//	    that.setXhr(xhr, file);
//	    if(xhr.timeout == 0) xhr.timeout = 60000;
//		file.isSending = true;
//		file.xhr = xhr;
//		xhr.send(file);
//	}
/*------------------------------------------------*/

/*------------------순서대로 전송-----------------*/
//	this.startUploadByTurn = function(){
//		if(that.files.length < 0) return;
//		var index = 0;
//		that.uploadByTurn(that.files[index], index);
//	}
//
//	this.uploadByTurn = function(file, index){
//		if(file.isSending || file.isSend || file.isCancel){
//			var i = index + 1;
//			if(that.files.length == i) return;
//			that.uploadByTurn(that.files[i], i);
//			return;
//		}
//		var xhr = new XMLHttpRequest();
//		xhr.ontimeout = function(e){
//			console.log(e);
//			xhr.abort();
//			console.log("timeout!");
//		}
//		xhr.upload.ontimeout = function(e){
//			console.log(e);
//			xhr.abort();
//			console.log("upload timeout!");
//		}
//		xhr.upload.onerror = function(e){
//			console.log(e);
//			xhr.abort();
//			console.log("upload error!");
//		}
//		xhr.upload.onprogress = function(e){
//			var percentComplete = Math.round(e.loaded * 100 / e.total);
//			file.sendPercent = percentComplete;
//			$("#" + that.progressId + index).width(percentComplete + '%');
//	        $("#" + that.progressId + index).text(percentComplete + '%');
//		}
//		xhr.onload = function(e){
//			file.isSend = true;
//			var data = JSON.parse(e.target.responseText);
//			that.successUpload(data);
//			var i = index + 1;
//			if(that.files.length == i) return;
//			that.uploadByTurn(that.files[i], i);
//		}
//	    xhr.onerror = function(e){
//			file.isSending = false;
//	    	xhr.abort();
//	    	that.failUpload(e);
//	    }
//	    that.setXhr(xhr, file);
//	    if(xhr.timeout == 0) xhr.timeout = 60000;
//		file.xhr = xhr;
//		file.isSending = true;
//		console.log(file);
//		xhr.send(file);
//	}
/*---------------------------------------------*/

/*-----------------WorkerUpload----------------*/
//  this.workerUpload = function(file, index) {
//		if(file.isSending || file.isSend || file.isCancel){
//			var i = index + 1;
//			if(that.files.length == i) return;
//			that.workerUpload(that.files[i], i);
//			return;
//		}
//
//      var uploadworker = new Worker("resource/worker/workerupload.js");
//      uploadworker.onmessage = function (e) {
//      	var data = e.data;
//      	switch(data.type){
//      	case 'progress':
//  			file.sendPercent = data.percentage;
//  			$("#" + that.progressId + index).width(data.percentage + '%');
//  	        $("#" + that.progressId + index).text(data.percentage + '%');
//      		break;
//      	case 'succeed':
//          	file.isSend = true;
//  			var i = index + 1;
//  			if(that.files.length == i) return;
//          	that.workerUpload(that.files[i], i);
//      		break;
//      	}
//      }
//      uploadworker.onerror = function (e) {
//			file.isSending = false;
//      	console.log(e);
//      }
//
//      file.worker = uploadworker;
//		file.isSending = true;
//		file.xhr = new XMLHttpRequest();
//      uploadworker.postMessage({
//      	type: 'send',
//      	file: file
//      });
//  }

/*---------------------------------------------*/

/**------------------------------------------------------------------------------------------------------------------**/

/**---------------------------Override Functions---------------------------------------------------------------------**/
//	this.successUpload = function(data){
//		var imgsrc = data.fileUrl;
//		var imgdiv = $("#dropbox > #" + that.imgDivId);
//		imgdiv.append("<div class='floatLeft'>");
//		imgdiv.append("<img src=" + imgsrc + " width='100' height='100'>");
//		imgdiv.append("</div>");
//	}
//
//	this.failUpload = function(e){
//    	alert("sending error");
//	}
//
//	this.setXhr = function(xhr, file){
//		xhr.open("POST", "http://192.168.10.207:8081/api/upload/simpleUpload", true);
//		xhr.setRequestHeader("X-File-Name", encodeURIComponent(file.name));
//	}
/**------------------------------------------------------------------------------------------------------------------**/

}
