
<?php
if ($_SERVER["REQUEST_METHOD"] == "POST") {
    // Get form values and sanitize
    $name = htmlspecialchars(trim($_POST['name']));
    $email = filter_var(trim($_POST['email']), FILTER_VALIDATE_EMAIL);
    $message = htmlspecialchars(trim($_POST['message']));

    // Check if fields are valid
    if ($name && $email && $message) {
        $to = "contact.killzonefx@gmail.com";  // Your email
        $subject = "New Contact Form Submission from $name";
        $body = "Name: $name\nEmail: $email\n\nMessage:\n$message";
        $headers = "From: $email\r\nReply-To: $email";

        if (mail($to, $subject, $body, $headers)) {
            echo "<p style='color:green;'>Message sent successfully!</p>";
        } else {
            echo "<p style='color:red;'>Oops! Something went wrong, please try again.</p>";
        }
    } else {
        echo "<p style='color:red;'>Please fill in all fields correctly.</p>";
    }
} else {
    echo "<p style='color:red;'>Invalid request.</p>";
}
?>
