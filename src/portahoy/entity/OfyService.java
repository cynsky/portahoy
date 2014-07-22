package portahoy.entity;

import com.googlecode.objectify.Objectify;
import com.googlecode.objectify.ObjectifyFactory;
import com.googlecode.objectify.ObjectifyFilter;
import com.googlecode.objectify.ObjectifyService;

public class OfyService {
	static {
		factory().register(RootEntity.class);
		factory().register(VPosition.class);
		
	}

	public static Objectify ofy() {
		return ObjectifyService.ofy();
	}

	public static ObjectifyFactory factory() {
		return ObjectifyService.factory();
	}
	
	public static void complete() {
		ObjectifyFilter.complete();

	}
}