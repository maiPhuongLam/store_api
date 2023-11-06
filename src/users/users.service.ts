import { Injectable, Inject } from '@nestjs/common';

import { sendMail } from 'src/shared/utility/mail-handler';
import {
  comparePassword,
  generateHashPassword,
} from 'src/shared/utility/password-manager';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserRepository } from 'src/shared/repositories/user.repository';
import configuration from 'src/config/configuration';
import { User, UserTypes } from 'src/shared/schemas/user';
import { generateAuthToken } from 'src/shared/utility/token-generator';

@Injectable()
export class UsersService {
  constructor(
    @Inject(UserRepository) private readonly userRepository: UserRepository,
  ) {}

  async create(createUserDto: CreateUserDto) {
    try {
      createUserDto.password = await generateHashPassword(
        createUserDto.password,
      );

      if (
        createUserDto.type === 'admin' &&
        createUserDto.secretToken !== configuration().adminSecretToken
      ) {
        throw new Error('You are not authorized to create admin user');
      }

      const userExist = await this.userRepository.getUserDetailsByEmail(
        createUserDto.email,
      );
      if (userExist && userExist.isVerified) {
        throw new Error('You already have an account with us. Please login.');
      }
      const otp = Math.floor(Math.random() * 900000) + 100000;
      const otpExpiryTime = new Date();
      otpExpiryTime.setMinutes(otpExpiryTime.getMinutes() + 10);

      const newUser = await this.userRepository.createNewUserInDB(
        createUserDto,
        otp,
        otpExpiryTime,
      );

      if (newUser.type === 'admin') {
        await this.userRepository.updateUserDetails(newUser._id.toString(), {
          isVerified: true,
        });
      } else {
        // send verifyEmail otp to user email
        sendMail(newUser.email, 'OTP', `<p>🚨 otp: ${otp}</p>`);
      }
      return {
        result: {
          email: newUser.email,
        },
        success: true,
        message:
          createUserDto.type === 'admin'
            ? 'Admin user created successfully. You can now login'
            : 'Please activate your account by verifying your email. We have sent you an email with the OTP.',
      };
    } catch (error) {
      throw error;
    }
  }

  // login a new user
  async login(email: string, password: string): Promise<any> {
    try {
      const userExist = await this.userRepository.getUserDetailsByEmail(email);
      if (!userExist) {
        throw new Error(
          `User is not exists with us. Please register yourself.`,
        );
      }
      // check user is verified or not
      if (!userExist.isVerified) {
        throw new Error('Please verify your email.');
      }

      // comapare password
      if (!(await comparePassword(userExist.password, password))) {
        throw new Error(`Wrong email or password`);
      }

      return {
        result: {
          user: {
            email: userExist.email,
            type: userExist.type,
            name: userExist.name,
            id: userExist._id.toString(),
          },
          token: generateAuthToken(userExist._id),
        },
        success: true,
        message: 'User logged in successfully',
      };
    } catch (error) {
      throw error;
    }
  }

  async findAll(type: UserTypes): Promise<any> {
    try {
      const users = await this.userRepository.getAllUsers(type);
      return {
        result: users,
        success: true,
        message: 'User logged in successfully',
      };
    } catch (error) {
      throw error;
    }
  }

  async findOne(id: string): Promise<any> {
    try {
      const user = await this.userRepository.getUserDetailsById(id);
      return {
        result: user,
        success: true,
        message: 'User logged in successfully',
      };
    } catch (error) {
      throw error;
    }
  }

  async updatePasswordOrName(id: string, data: UpdateUserDto): Promise<any> {
    try {
      const { oldPassword, newPassword, name } = data;
      if (!name && !newPassword) {
        throw new Error('Please provide data to update');
      }
      const userExist = await this.userRepository.getUserDetailsById(id);
      if (!userExist) {
        throw new Error('User not found');
      }
      if (newPassword) {
        if (!(await comparePassword(userExist.password, oldPassword))) {
          throw new Error('Current password does not matched.');
        }
        const password = await generateHashPassword(newPassword);
        await this.userRepository.updateUserDetails(id, { password, name });
      } else if (name) {
        await this.userRepository.updateUserDetails(id, { name });
      }

      return {
        result: {
          email: userExist.email,
          type: userExist.type,
          name: name || userExist.name,
          id: userExist._id.toString(),
        },
        success: true,
        message: 'Password updated successfully',
      };
    } catch (error) {
      throw error;
    }
  }

  async forgotPassword(email: string): Promise<any> {
    try {
      const userExist = await this.userRepository.getUserDetailsByEmail(email);
      if (!userExist) {
        throw new Error(
          `User is not exists with us. Please register yourself.`,
        );
      }
      // generate random password
      const password = Math.random().toString(36).substring(2, 12);
      const hashedPassword = await generateHashPassword(password);
      await this.userRepository.updateUserDetails(userExist._id, {
        password: hashedPassword,
      });
      // send email with new password
      sendMail(email, 'Forgot password', `<p>🚨 New password: ${password}</p>`);

      return {
        success: true,
        message: 'New password sent to your email',
        result: {
          email,
        },
      };
    } catch (error) {
      throw error;
    }
  }

  async resendOtpMailMessage(email: string): Promise<any> {
    try {
      const userExist = await this.userRepository.getUserDetailsByEmail(email);
      if (!userExist) {
        throw new Error(
          `User is not exists with us. Please register yourself.`,
        );
      }
      // generate otp
      const otp = Math.floor(Math.random() * 900000) + 100000;
      // otp expiery time
      const otpExpiryTime = new Date();
      otpExpiryTime.setMinutes(otpExpiryTime.getMinutes() + 10);

      await this.userRepository.updateUserDetails(userExist._id, {
        otp,
        otpExpiryTime,
      });
      // send verifyEmail otp to user email
      sendMail(email, 'OTP', `<p>🚨 Otp: ${otp}</p>`);
      return {
        success: true,
        message: 'OTP sent to your email',
        result: {
          email,
        },
      };
    } catch (error) {
      throw error;
    }
  }

  async verifyEmail(otp: string, email: string): Promise<any> {
    try {
      const userExist = await this.userRepository.getUserWithOtpAndEmail(
        otp,
        email,
      );
      if (!userExist) {
        throw new Error(
          `User is not exists with us. Please register yourself.`,
        );
      }
      // check expiery time of otp
      const currentTime = new Date();
      if (currentTime > userExist.otpExpiryTime) {
        throw new Error('OTP is expired.');
      }
      await this.userRepository.updateUserDetails(userExist._id, {
        isVerified: true,
      });
      return {
        success: true,
        message: 'Email verified successfully. You can login now.',
      };
    } catch (error) {
      throw error;
    }
  }
}
