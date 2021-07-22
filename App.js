import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  Button,
  Image,
  Linking,
  PermissionsAndroid,
} from 'react-native';
import ImagePicker from 'react-native-image-crop-picker';
import {Upload} from 'react-native-tus-client';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heading: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
  },
});

export default class App extends React.Component {
  constructor() {
    super();

    this.state = {
      uploadedBytes: 0,
      totalBytes: 0,
      file: null,
      status: 'no file selected',
      uploadUrl: null,
    };

    this.startUpload = this.startUpload.bind(this);
    this.selectPhotoTapped = this.selectPhotoTapped.bind(this);
    this.openUploadUrl = this.openUploadUrl.bind(this);
  }

  getFileExtension(uri) {
    const match = /\.([a-zA-Z]+)$/.exec(uri);
    if (match !== null) {
      return match[1];
    }

    return '';
  }

  getMimeType(extension) {
    if (extension === 'jpg') {
      return 'image/jpeg';
    }
    return `image/${extension}`;
  }

  hasAndroidPermission = async () => {
    const permission = PermissionsAndroid.PERMISSIONS.CAMERA;

    console.log('permission', permission);

    const hasPermission = await PermissionsAndroid.check(permission);
    if (hasPermission) {
      return true;
    }

    const status = await PermissionsAndroid.request(permission);
    return status === 'granted';
  };

  async selectPhotoTapped() {
    if (!this.hasAndroidPermission()) {
      return;
    }
    ImagePicker.openPicker({}).then(file => {
      console.log('file', file);
      this.setState({
        file: file,
        status: 'file selected',
      });
    });
  }

  startUpload() {
    const {file} = this.state;

    if (!file) {
      return;
    }

    const extension = this.getFileExtension(file.path);
    const upload = new Upload(file.path.split('file://')[1], {
      endpoint: 'https://tusd.tusdemo.net/files/',
      retryDelays: [0, 1000, 3000, 5000],
      metadata: {
        filename: `photo.${extension}`,
        filetype: this.getMimeType(extension),
      },
      onError: error => {
        this.setState({
          status: `upload failed ${error}`,
        });
      },
      onProgress: (uploadedBytes, totalBytes) => {
        this.setState({
          totalBytes,
          uploadedBytes,
        });
      },
      onSuccess: () => {
        this.setState({
          status: 'upload finished',
          uploadUrl: upload.url,
        });
        console.log('Upload URL:', upload.url);
      },
    });
    console.log('xxxxx');
    upload.start();

    this.setState({
      status: 'upload started',
      uploadedBytes: 0,
      totalBytes: 0,
      uploadUrl: null,
    });
  }

  openUploadUrl() {
    Linking.openURL(this.state.uploadUrl);
  }

  render() {
    console.log('this.state.file', this.state.file);
    return (
      <View style={styles.container}>
        <Text style={styles.heading}>
          Resume upload running in React Native
        </Text>

        {this.state.file !== null && (
          <Image
            style={{width: 200, height: 200}}
            source={{
              uri: this.state.file.path,
            }}
          />
        )}

        <Button onPress={this.selectPhotoTapped} title="Select a Photo" />

        <Text>
          Status:
          {this.state.status}
        </Text>
        <Text>
          {this.state.uploadedBytes} of {this.state.totalBytes}
        </Text>
        <Button
          onPress={this.startUpload}
          title="Start Upload"
          accessibilityLabel="Start uploading a file"
        />

        {this.state.uploadUrl && (
          <Button
            onPress={this.openUploadUrl}
            title="Show Uploaded File"
            accessibilityLabel="Open uploaded file"
          />
        )}
      </View>
    );
  }
}
