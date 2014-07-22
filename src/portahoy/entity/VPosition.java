package portahoy.entity;

import static portahoy.entity.OfyService.ofy;

import java.text.DateFormat;
import java.text.ParseException;
import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.Date;
import java.util.Iterator;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;
import java.util.logging.Logger;

import com.google.common.base.CharMatcher;
import com.google.common.base.Optional;
import com.google.common.base.Splitter;
import com.google.common.base.Strings;
import com.google.common.primitives.Doubles;
import com.google.common.primitives.Ints;
import com.googlecode.objectify.Key;
import com.googlecode.objectify.annotation.Cache;
import com.googlecode.objectify.annotation.Entity;
import com.googlecode.objectify.annotation.Id;
import com.googlecode.objectify.annotation.Index;
import com.googlecode.objectify.annotation.Parent;
import com.googlecode.objectify.annotation.Unindex;

@Entity
@Cache
@Unindex
public class VPosition {
	private static final Logger log = Logger.getLogger(VPosition.class
			.getName());
	@Parent
	private transient Key<RootEntity> parent;
	@Id
	private Long id;
	@Index
	private int vid;
	@Index
	private double lat;
	@Index
	private double lng;
	@Index
	private double course;
	/**
	 * Country of registration
	 */
	@Index
	private String country;
	@Index
	private int length;
	@Index
	private int beam;
	@Index
	private int grossTonnage;
	@Index
	private double speed;
	/**
	 * Timestamp in ISO-8601 format e.g. "2013-02-08 09:30:26.123"
	 */
	@Index
	private String timestamp;

	public VPosition() {
		vid = 0;
		lat = 0;
		lng = 0;
		course = 0;
		country = "";
		length = 0;
		beam = 0;
		grossTonnage = 0;
		speed = 0;
		timestamp = "";
	}

	public static VPosition build(String csv) throws ParseException {
		VPosition pos = new VPosition();

		if (!Strings.isNullOrEmpty(csv)) {

			// Tokenize the csv values delimited by comma

			List<String> columns = Splitter.on(',').splitToList(csv);

			// 1st column is vessel id

			pos.vid(columns.get(0));

			// Skip 2nd column (vessel manager)
			// 3rd column is latitude

			pos.lat(columns.get(2));

			// 4th column is longitude

			pos.lng(columns.get(3));

			// 5th column is course

			pos.course(columns.get(4));

			// 6th column is country of registration

			pos.country(columns.get(5));

			// 7th column is length of vessel

			pos.length(columns.get(6));

			// 8th column is gross tonnage

			pos.grossTonnage(columns.get(7));

			// 9th column is beam of vessel

			pos.beam(columns.get(8));

			// 10th column is speed of vessel

			pos.speed(columns.get(9));

			// 11th column is timestamp

			pos.timestamp(columns.get(10));

		} else {
			log.warning("CSV row: this string is null or empty");
		}
		return pos;
	}

	public Long id() {
		return id;
	}

	public int vid() {
		return vid;
	}

	public void vid(String vid) {
		Integer value = Ints.tryParse(vid);
		if (value != null) {
			this.vid = value;
		}
	}

	public void vid(int vid) {
		this.vid = vid;
	}

	public double lat() {
		return lat;
	}

	public void lat(String lat) {
		Double value = Doubles.tryParse(lat);
		if (value != null) {
			this.lat = value;
		}
	}

	public void lat(double lat) {
		this.lat = lat;
	}

	public double lng() {
		return lng;
	}

	public void lng(String lng) {
		Double value = Doubles.tryParse(lng);
		if (value != null) {
			this.lng = value;
		}
	}

	public void lng(double lng) {
		this.lng = lng;
	}

	public double course() {
		return course;
	}

	public void course(String course) {
		Double value = Doubles.tryParse(course);
		if (value != null) {
			this.course = value;
		}
	}

	public void course(double course) {
		this.course = course;
	}

	public String country() {
		return country;
	}

	public void country(String country) {
		// All String attributes indexed in lower case
		if (!Strings.isNullOrEmpty(country)) {
			this.country = country.trim().toLowerCase();
		}
	}

	public int length() {
		return length;
	}

	public void length(String length) {
		Integer value = Ints.tryParse(length);
		if (value != null) {
			this.length = value;
		}
	}

	public void length(int length) {
		this.length = length;
	}

	public int beam() {
		return beam;
	}

	public void beam(String beam) {
		Integer value = Ints.tryParse(beam);
		if (value != null) {
			this.beam = value;
		}
	}

	public void beam(int beam) {
		this.beam = beam;
	}

	public int grossTonnage() {
		return grossTonnage;
	}

	public void grossTonnage(String grossTonnage) {
		Integer value = Ints.tryParse(grossTonnage);
		if (value != null) {
			this.grossTonnage = value;
		}
	}

	public void grossTonnage(int grossTonnage) {
		this.grossTonnage = grossTonnage;
	}

	public double speed() {
		return speed;
	}

	public void speed(String speed) {
		Double value = Doubles.tryParse(speed);
		if (value != null) {
			this.speed = value;
		}
	}

	public void speed(double speed) {
		this.speed = speed;
	}

	public String timestamp() {
		return timestamp;
	}

	public void timestamp(String timestamp) throws ParseException {

		if (!Strings.isNullOrEmpty(timestamp)) {
			DateFormat fromFormat = new SimpleDateFormat(
					"MMM dd yyyy hh:mm:ss:SSSa");
			fromFormat.setLenient(false);
			DateFormat toFormat = new SimpleDateFormat(
					"yyyy-MM-dd HH:mm:ss.SSS");
			toFormat.setLenient(false);
			Date date = fromFormat.parse(timestamp);
			this.timestamp = toFormat.format(date);
		}
	}

	public static Optional<List<VPosition>> search(String timeFrom, String timeTo) {

		// Sorted by date, cluster number
		// First sort property must match the property on inequality filter

		List<VPosition> result = ofy().load().type(VPosition.class)
				.filter("timestamp >=", timeFrom).filter("timestamp <=", timeTo).order("timestamp").list();

		if (!result.isEmpty()) {
			return Optional.of(result);
		}
		log.warning("No results for this time window From: " + timeFrom + " To: " + timeTo);
		return Optional.absent();
	}
}
