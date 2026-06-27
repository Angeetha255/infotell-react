import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { setLoginOpen } from "../store/store";

export default function LoginPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  useEffect(() => {
    dispatch(setLoginOpen(true));
    navigate("/", { replace: true });
  }, [dispatch, navigate]);

  return null;
}
