package portahoy.entity;

import com.googlecode.objectify.annotation.Entity;
import com.googlecode.objectify.annotation.Id;

@Entity
public class RootEntity {
	public final static String DEFAULT_ENTITY_GROUP = "portahoy";
	
	@Id String id;
	
	public RootEntity() {
		id = DEFAULT_ENTITY_GROUP;
	}
}
