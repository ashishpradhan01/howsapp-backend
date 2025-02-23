class SessionException extends Error {
  constructor(message) {
    super(message);
    this.name = "SessionException";
  }
}

class InvalidPageException extends Error {
  constructor(message) {
    super(message);
    this.name = "InvalidPageException";
  }
}

class QRCodeRetrievalError extends Error {
  constructor(message) {
    super(message);
    this.name = "QRCodeRetrievalError";
  }
}

class QRScannedException extends Error {
  constructor(message) {
    super(message);
    this.name = "QRScannedException";
  }
}

class AuthenticationException extends Error {
  constructor(message) {
    super(message);
    this.name = "AuthenticationException";
  }
}

class TimeOutException extends Error {
  constructor(message) {
    super(message);
    this.name = "TimeOutException";
  }
}

module.exports = {
  SessionException,
  InvalidPageException,
  QRCodeRetrievalError,
  QRScannedException,
  AuthenticationException,
  TimeOutException,
};
