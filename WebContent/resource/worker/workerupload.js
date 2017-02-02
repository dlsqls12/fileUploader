var file = null, p = true;
var BYTES_PER_CHUNK = 100 * 1024 * 1024;
var uploadUrl = 'http://localhost:8081/api/upload/uploadAndMerge';

self.onmessage = function(e) {
	var data = e.data;
	switch(data.type){
	case 'send':
		file = data.file;
		fileUpload(file, 0);
		break;
	case 'abort':
		file.xhr.abort();
		break;
	}
}

function fileUpload(blob, index){
	var chunkCount = blob.size / this.BYTES_PER_CHUNK;
	if(chunkCount < index){
		//merge(blob.name, index);
		self.postMessage({
			type: 'succeed',
			name: blob.name,
			content: 'Uploaded Succesfully'
		});
		return;
	}
	var start = this.BYTES_PER_CHUNK * index;
	var end = start + this.BYTES_PER_CHUNK;
	var chunk = blob.slice(start, end);
	var str = uploadUrl
		+ '?fileName=' + blob.name
		+ '&chunkNumber=' + index;

	var xhr = new XMLHttpRequest();
	xhr.open('POST', str, true);
	xhr.setRequestHeader('Content-Type', file.type + '; charset=UTF-8');
	try{
		xhr.upload.onprogress = function(e) {
			var percentage = Math.round(((e.loaded / BYTES_PER_CHUNK) + index) * 100 / chunkCount);
			self.postMessage({
				type: 'progress',
				percentage: percentage
			});
		};
	} catch (e){
		xhr.onprogress = function(e) {
			var percentage = Math.round(((e.loaded / BYTES_PER_CHUNK) + index) * 100 / chunkCount);
			self.postMessage({
				type: 'progress',
				percentage: percentage
			});
		};
	}
	xhr.onload = function(e) {
		fileUpload(blob, ++index);
	};
	file.xhr = xhr;
	file.isSend = true;
	xhr.send(chunk);
}

//function merge(name, count){
//	var str = 'http://localhost:8081/api/upload/simpleMerge?'
//		+ 'fileName=' + name
//		+ '&total=' + count;
//	var xhr = new XMLHttpRequest();
//	xhr.open('GET', str, true);
//	xhr.onload = function(e) {
//		file.isSend = true;
//	};
//	xhr.send();
//}
