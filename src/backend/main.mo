import Time "mo:core/Time";
import Order "mo:core/Order";
import Runtime "mo:core/Runtime";
import Int "mo:core/Int";
import Array "mo:core/Array";

actor {
  type FormSubmission = {
    name : Text;
    email : Text;
    message : Text;
    timestamp : Time.Time;
  };

  module FormSubmission {
    public func compare(sub1 : FormSubmission, sub2 : FormSubmission) : Order.Order {
      Int.compare(sub1.timestamp, sub2.timestamp);
    };
  };

  var submissions : [FormSubmission] = [];

  public shared ({ caller }) func submitContactForm(name : Text, email : Text, message : Text) : async () {
    if (name == "" or email == "" or message == "") {
      Runtime.trap("All fields are required");
    };
    let newSubmission : FormSubmission = {
      name;
      email;
      message;
      timestamp = Time.now();
    };
    submissions := submissions.concat([newSubmission]);
  };

  public query ({ caller }) func getAllSubmissionsSortedByTimestamp() : async [FormSubmission] {
    submissions.sort();
  };
};
