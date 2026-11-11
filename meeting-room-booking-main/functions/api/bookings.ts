import { createCalendar } from '../../server/google/calendar';
import { json, handleError } from '../../server/http';
import { readJson } from '../../server/readJson';
import type { Env } from '../../server/google/auth';
import { book } from '../../server/booking/service';
export const onRequestPost: PagesFunction<Env> = async ({request,env}) => {
  try {
    const input = await readJson(request);
    await book(input,createCalendar(env));
    return json({status:'confirmed'},201);
  } catch(error) {return handleError(error);}
};
