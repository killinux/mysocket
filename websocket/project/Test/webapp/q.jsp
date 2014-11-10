<%
String m = request.getParameter("m");
String u = request.getParameter("u");
//request.getRequestDispatcher("/jm/demos/swipe-list/swip.jsp?m="+m+"&u="+u).forward(request, response);

response.sendRedirect("http://haoning.net/webs/jm/demos/swipe-list/swip.jsp?m="+m+"&u="+u);
%>