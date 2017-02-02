<%@ page contentType="text/html;charset=UTF-8"%>
<%@ page import="java.io.*"%>
<%@ page import="org.json.simple.*"%>
<%@ page import="java.net.URLDecoder"%>
<%
	response.setHeader("Access-Control-Allow-Origin", "*");
	response.setHeader("Access-Control-Allow-Headers", "X-File-Name");

	if (!"OPTIONS".equals(request.getMethod().toUpperCase())) {
		String fileName = URLDecoder.decode(request.getHeader("X-File-Name"), "UTF-8");
		System.out.println(fileName);
		String ext = fileName.substring(fileName.lastIndexOf("."));
		String uploadFileName = fileName.substring(0, fileName.lastIndexOf(".")) + "_" + System.currentTimeMillis() + ext;
		File uploadDir = new File(application.getRealPath("fileupload"));
		if (!uploadDir.exists()) {
			uploadDir.mkdir();
		}
		File uploadFile = new File(uploadDir, uploadFileName);

		InputStream in = request.getInputStream();
		OutputStream outFile = new FileOutputStream(uploadFile);
		byte[] buf = new byte[1024 * 2];
		int size = 0;
		int fileSize = 0;
		while ((size = in.read(buf)) != -1) {
			outFile.write(buf, 0, size);
			fileSize += size;
		}
		outFile.close();
		in.close();

		String fileUrl = application.getContextPath() + "/fileupload/" + uploadFileName;
		//out.write("<a href='" + fileUrl + "'>" + fileName + "</a>");
		JSONObject outData = new JSONObject();
		outData.put("fileUrl", fileUrl);
		outData.put("fileName", fileName);
		outData.put("fileSize", fileSize);
		String outDataStr = outData.toJSONString();
		out.write(outDataStr);
	}
%>
