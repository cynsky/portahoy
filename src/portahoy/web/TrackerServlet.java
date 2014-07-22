package portahoy.web;

import java.io.IOException;
import java.io.PrintWriter;
import java.util.List;
import java.util.logging.Logger;

import javax.servlet.http.*;

import portahoy.entity.VPosition;

import com.google.common.base.Optional;
import com.google.common.base.Strings;
import com.google.gson.Gson;

@SuppressWarnings("serial")
public class TrackerServlet extends HttpServlet {
	
	private static final Logger log = Logger.getLogger(TrackerServlet.class
			.getName());

	private static final String TIMESTAMP_FROM = "from";
	private static final String TIMESTAMP_TO = "to";
	
	public void doGet(HttpServletRequest req, HttpServletResponse resp)
			throws IOException {
		String from = req.getParameter(TIMESTAMP_FROM);
		String to = req.getParameter(TIMESTAMP_TO);
		
		resp.setContentType("application/json");
		resp.setCharacterEncoding("UTF-8");
		PrintWriter out = resp.getWriter();

		if (!Strings.isNullOrEmpty(from) && !Strings.isNullOrEmpty(to)) {

			Optional<List<VPosition>> result = VPosition.search(from, to);

			if (result.isPresent()) {
				Gson gson = new Gson();
				out.write(gson.toJson(result.get()));

			} else {
				// Return empty array in JSON
				out.write("");
			}

		} else {
			log.warning("Parameters are insufficient or invalid");
			// Return empty array in JSON
			out.write("");
		}
		out.close();
	}
}
