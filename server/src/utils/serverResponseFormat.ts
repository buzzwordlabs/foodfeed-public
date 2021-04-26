export const customServerErrorResponse = ({
  key,
  message
}: {
  key: string;
  message: string;
}) => {
  return { errors: [{ location: 'body', msg: message, param: key }] };
};
