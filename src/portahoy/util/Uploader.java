package portahoy.util;

import static portahoy.entity.OfyService.ofy;

import java.io.BufferedReader;
import java.io.File;
import java.io.FileNotFoundException;
import java.io.FileReader;
import java.io.IOException;
import java.text.ParseException;
import java.util.ArrayList;
import java.util.List;

import portahoy.entity.OfyService;
import portahoy.entity.VPosition;
import portahoy.entity.RootEntity;

import com.google.appengine.labs.repackaged.com.google.common.primitives.Ints;
import com.google.appengine.tools.remoteapi.RemoteApiInstaller;
import com.google.appengine.tools.remoteapi.RemoteApiOptions;
import com.googlecode.objectify.Key;

public class Uploader {

	private static boolean prodMode = false;
	
	public static void main(String[] args) throws IOException, ParseException {

		String username = "";
		String password = "";
		String host = "localhost";
		int port = Ints.tryParse(args[3]);
		

		if (args[2].equalsIgnoreCase("prod")) {
			prodMode = true;
		}

		if (prodMode) {
			host = "portahoy.appspot.com";
			
			username = args[0];
			password = args[1];
		}

		String inFilePath = args[4];

		List<VPosition> positions = importCsv(inFilePath);

		/*
		 * Configuring Remote API on Standalone Client
		 * 
		 * @url
		 * https://developers.google.com/appengine/docs/java/tools/remoteapi
		 */

		RemoteApiOptions options = new RemoteApiOptions().server(host, port)
				.credentials(username, password);

		RemoteApiInstaller installer = new RemoteApiInstaller();
		try {
			installer.install(options);

			// empty();

			upload(positions);

			// createRootEntity();

		} catch (IOException e) {

			e.printStackTrace();
		} finally {
			OfyService.complete();
			installer.uninstall();
			System.out.println("Done!");
		}
	}

	private static void upload(List<VPosition> positions) {

		int batchSize = 10000;
		int endIndex = 0;
		List<VPosition> batch = null;

		// Save positions in batches of 1000

		for (int i = 0; i < positions.size(); i += batchSize) {

			endIndex += batchSize;

			if (endIndex > positions.size()) {
				endIndex = positions.size();
			}
			batch = positions.subList(i, endIndex);

			if (prodMode) {
				
				// TODO: Aysnc does not seem to work!
				// Throws the following error:
				// SEVERE: Error cleaning up pending Future: 
				// com.googlecode.objectify.cache.CachingAsyncDatastoreService
				
				ofy().save().entities(batch).now();
			} else {
				ofy().save().entities(batch).now();
			}

			System.out.println("Uploaded rows: " + (i + 1) + " - " + endIndex);
		}

		System.out.println("Total " + positions.size() + " rows uploaded");
	}

	private static void empty() {
		List<Key<VPosition>> keys = ofy().load().type(VPosition.class).keys()
				.list();
		ofy().delete().keys(keys).now();
		System.out.println(keys.size() + " rows deleted");
	}

	private static List<VPosition> importCsv(String filePath)
			throws IOException, ParseException {
		File inFile = new File(filePath);
		BufferedReader br = null;
		String row = "";
		int count = 0;
		List<VPosition> positions = new ArrayList<VPosition>();
		try {
			br = new BufferedReader(new FileReader(inFile));

			// Skip the first row (column headers)
			row = br.readLine();

			while ((row = br.readLine()) != null) {

				positions.add(VPosition.build(row));
				count++;
			}

			System.out.println("Completed extraction from csv file:\n"
					+ filePath + "\nThere are " + count
					+ " data rows in this file.");
		} catch (FileNotFoundException e) {

			e.printStackTrace();
		} finally {
			br.close();

		}
		return positions;
	}

	private static void createRootEntity() {
		RootEntity root = new RootEntity();
		ofy().save().entity(root).now();
		System.out.println("Root created");
	}

}
