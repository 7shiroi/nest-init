import { JwtUser } from '../../common/decorators/get-user.decorator';

declare global {
  namespace Express {
    interface Request {
      user?: JwtUser;
    }
  }
}
