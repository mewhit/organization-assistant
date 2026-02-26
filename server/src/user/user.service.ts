import { Effect } from "effect";
import { UserAlreadyExists, UserStorage, UserStorageUnavailable } from "./user.storage";

type User = {
  id: number;
  email: string;
  name: string;
};

export class UserService {
  static create = (email: string, name: string): Effect.Effect<User, UserAlreadyExists | UserStorageUnavailable> =>
    UserStorage.insert(email, name);
}
