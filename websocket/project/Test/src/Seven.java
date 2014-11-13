import java.math.BigDecimal;


public class Seven {

	/**
	 * @param args
	 */
	public static void main(String[] args) {
		/*int v=7;	  // 1014492753623188405797
		//BigDecimal bb= new BigDecimal(null);
		for(long i=1;i<9999999999999l;i++){
			//System.out.println(Long.valueOf(v+""+i).longValue()/Long.valueOf(i+""+v).longValue());
			if((Long.valueOf(v+""+i).longValue()/Long.valueOf(i+""+v).longValue()==v)
					&&
					(Long.valueOf(v+""+i).longValue()%Long.valueOf(i+""+v).longValue()==0)){
				System.out.println(i+""+v);
				break;
			}
		}*/
		int i=1;
		int v=7;
		while(!((Long.valueOf(v+""+i).longValue()/Long.valueOf(i+""+v).longValue()==v)
				&&
				(Long.valueOf(v+""+i).longValue()%Long.valueOf(i+""+v).longValue()==0))){
			i++;
		}
		System.out.println(i+""+v);
		///System.out.println(Long.valueOf(11+"").longValue()/Long.valueOf(11+"").longValue());
		//System.out.println(Long.valueOf(11+"").longValue()%Long.valueOf(11+"").longValue());
		System.out.println("over");
	}

}
