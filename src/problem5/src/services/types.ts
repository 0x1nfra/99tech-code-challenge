export enum ServiceResponseStatus {
  Error,
  Success = 200,
}

export type ServiceResponseSuccess<T> = {
  status: ServiceResponseStatus.Success;
  message: string;
  data: T;
};

export type ServiceResponseError = {
  status: ServiceResponseStatus.Error;
  message: string;
  data: {
    code?: number;
    error: string;
  };
};

export type ServiceResponse<Data> = Promise<
  ServiceResponseSuccess<Data> | ServiceResponseError
>;
