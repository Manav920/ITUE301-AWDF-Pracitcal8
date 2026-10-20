import React from 'react';

function Footer({ studentId, academicYear, email, githubUrl }) {
  return (
    <footer id="contact" className="footer-container">
      <div className="footer-content">
        <p className="footer-dept">
          Department of Computer Science and Engineering, CSPIT
        </p>
        <p className="footer-student">
          Student ID: <strong>{studentId}</strong> | Academic Year: <strong>{academicYear}</strong>
        </p>
        <div className="footer-links">
          <span>Contact: <a href={`mailto:${email}`}>{email}</a></span>
          <span>•</span>
          <span>GitHub: <a href={githubUrl} target="_blank" rel="noreferrer">24CS048Manav</a></span>
        </div>
        <p className="footer-copy">
          &copy; {new Date().getFullYear()} Manav Lathiya. All rights reserved. Built with React & Vite.
        </p>
      </div>
    </footer>
  );
}

export default Footer;
